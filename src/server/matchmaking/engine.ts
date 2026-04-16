import type { UserProfile } from '@/lib/types';
import type {
  MatchmakingBreakdown,
  MatchmakingCandidateScore,
  MatchmakingExplanation,
  MatchmakingSignal,
} from './types';

const ENGINE_VERSION = 'v1.1.0';

const SCORE_WEIGHTS = {
  values: 0.28,
  communication: 0.24,
  datingPace: 0.2,
  lifestyle: 0.16,
  emotional: 0.12,
} as const;

const TOP_REASON_COUNT = 3;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(value => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);
}

function overlapScore(a: string[], b: string[], idealOverlap = 3): number {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a.map(normalizeToken));
  const matches = b.filter(v => setA.has(normalizeToken(v))).length;
  return clamp((Math.min(idealOverlap, matches) / idealOverlap) * 100);
}

function readNumber(source: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

function readStringArray(source: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const values = normalizeStringArray(source[key]);
    if (values.length > 0) return values;
  }
  return [];
}

function hasTruthy(source: Record<string, unknown>, keys: string[]): boolean {
  return keys.some(key => {
    const value = source[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === 'complete' || normalized === 'completed';
    }
    return false;
  });
}

function attachmentCompatibility(a: UserProfile['attachmentStyle'], b: UserProfile['attachmentStyle']): number {
  const matrix: Record<string, Record<string, number>> = {
    secure: { secure: 94, anxious: 82, avoidant: 70, disorganized: 62 },
    anxious: { secure: 78, anxious: 68, avoidant: 50, disorganized: 48 },
    avoidant: { secure: 74, anxious: 52, avoidant: 60, disorganized: 50 },
    disorganized: { secure: 66, anxious: 50, avoidant: 48, disorganized: 44 },
  };
  return matrix[a]?.[b] ?? 55;
}

function loveLanguageCompatibility(a: UserProfile['loveLanguage'], b: UserProfile['loveLanguage']): number {
  if (a === b) return 92;
  const compatiblePairs = new Set(['acts-time', 'time-acts', 'words-touch', 'touch-words', 'gifts-acts', 'acts-gifts']);
  return compatiblePairs.has(`${a}-${b}`) ? 80 : 66;
}

function goalCompatibility(a: UserProfile['relationshipGoal'], b: UserProfile['relationshipGoal']): number {
  if (a === b) return 95;
  if (a === 'relationship' && b === 'unsure') return 62;
  if (a === 'unsure' && b === 'relationship') return 62;
  if (a === 'friendship' || b === 'friendship') return 42;
  if (a === 'casual' || b === 'casual') return 40;
  return 50;
}

function locationScore(distanceKm: number | undefined): number {
  if (distanceKm === undefined) return 62;
  if (distanceKm <= 5) return 94;
  if (distanceKm <= 15) return 82;
  if (distanceKm <= 30) return 70;
  if (distanceKm <= 50) return 58;
  return 44;
}

function lifestyleHabitScore(a: UserProfile, b: UserProfile): number {
  let score = locationScore(b.distance);
  if (a.drinking && b.drinking) score += normalizeToken(a.drinking) === normalizeToken(b.drinking) ? 5 : -4;
  if (a.smoking && b.smoking) score += normalizeToken(a.smoking) === normalizeToken(b.smoking) ? 8 : -10;
  if (a.kids && b.kids) score += normalizeToken(a.kids) === normalizeToken(b.kids) ? 7 : -6;
  return clamp(score);
}

function getProfileCompleteness(profile: UserProfile): number {
  const source = profile as unknown as Record<string, unknown>;
  const explicit = readNumber(source, ['profileCompleteness', 'profile_completeness', 'completeness'], -1);
  if (explicit >= 0) return Math.max(0, Math.min(1, explicit));

  let score = 0;
  if (profile.bio.trim().length >= 40) score += 0.22;
  if (profile.location.trim().length >= 2) score += 0.12;
  if (profile.photos.length > 0) score += 0.2;
  if (profile.interests.length >= 3) score += 0.16;
  if (profile.values.length >= 3) score += 0.16;
  if (profile.relationshipGoal) score += 0.08;
  if (profile.occupation.trim().length >= 2) score += 0.06;
  return Math.min(1, score);
}

function isOnboardingComplete(profile: UserProfile): boolean {
  const source = profile as unknown as Record<string, unknown>;
  return (
    hasTruthy(source, ['onboardingComplete', 'onboarding_complete']) ||
    String(source.onboardingStatus ?? '').toLowerCase() === 'complete' ||
    getProfileCompleteness(profile) >= 0.7
  );
}

function getIntents(profile: UserProfile): string[] {
  const source = profile as unknown as Record<string, unknown>;
  const configured = readStringArray(source, ['intentPreferences', 'relationshipIntentPreferences', 'relationshipGoalPreferences'])
    .map(normalizeToken);
  if (configured.length > 0) return configured;
  return [normalizeToken(profile.relationshipGoal)];
}

function getGenderPreferences(profile: UserProfile): string[] {
  const source = profile as unknown as Record<string, unknown>;
  return readStringArray(source, ['genderPreference', 'genderPreferences', 'preferredGenders']).map(normalizeToken);
}

function ageRange(profile: UserProfile): { min: number; max: number } {
  const source = profile as unknown as Record<string, unknown>;
  const min = readNumber(source, ['preferredMinAge', 'minAge', 'ageMin', 'preferenceMinAge'], 18);
  const max = readNumber(source, ['preferredMaxAge', 'maxAge', 'ageMax', 'preferenceMaxAge'], 99);
  return { min: Math.max(18, min), max: Math.min(99, Math.max(min, max)) };
}

function maxDistanceKm(profile: UserProfile): number {
  const source = profile as unknown as Record<string, unknown>;
  return readNumber(source, ['maxDistanceKm', 'distancePreferenceKm', 'distancePreference', 'maxDistance', 'distance'], 100);
}

function dealbreakerMap(profile: UserProfile): Record<string, Set<string>> {
  const source = profile as unknown as Record<string, unknown>;
  const output: Record<string, Set<string>> = {};

  const addEntries = (field: string, values: unknown) => {
    const normalized = normalizeStringArray(values).map(normalizeToken);
    if (!normalized.length) return;
    output[field] = output[field] ?? new Set<string>();
    for (const value of normalized) output[field].add(value);
  };

  const mapped = source.dealbreakerMap ?? source.dealbreakersByField ?? source.dealbreaker_preferences;
  if (mapped && typeof mapped === 'object') {
    for (const [field, values] of Object.entries(mapped)) {
      addEntries(normalizeToken(field), values);
    }
  }

  const list = normalizeStringArray(source.dealbreakers);
  for (const token of list.map(normalizeToken)) {
    if (token.includes('smok')) addEntries('smoking', ['smokes', 'socially', 'regularly']);
    if (token.includes('drink')) addEntries('drinking', ['frequently']);
    if (token.includes('kids')) addEntries('kids', ['want kids', 'open to it']);
  }

  return output;
}

function fieldCollision(disallowedMap: Record<string, Set<string>>, field: string, value: string | undefined): boolean {
  if (!value) return false;
  const denied = disallowedMap[field];
  if (!denied || denied.size === 0) return false;
  return denied.has(normalizeToken(value));
}

function intentMismatch(user: UserProfile, candidate: UserProfile): boolean {
  const userIntents = getIntents(user);
  const candidateIntents = getIntents(candidate);
  const overlap = userIntents.filter(intent => candidateIntents.includes(intent));
  return overlap.length === 0;
}

function ageMismatch(user: UserProfile, candidate: UserProfile): boolean {
  const userRange = ageRange(user);
  const candidateRange = ageRange(candidate);
  const userAcceptsCandidate = candidate.age >= userRange.min && candidate.age <= userRange.max;
  const candidateAcceptsUser = user.age >= candidateRange.min && user.age <= candidateRange.max;
  return !userAcceptsCandidate || !candidateAcceptsUser;
}

function distanceMismatch(user: UserProfile, candidate: UserProfile): boolean {
  if (typeof candidate.distance !== 'number') return false;
  const userMax = maxDistanceKm(user);
  const candidateMax = maxDistanceKm(candidate);
  return candidate.distance > userMax || candidate.distance > candidateMax;
}

function genderPreferenceMismatch(user: UserProfile, candidate: UserProfile): boolean {
  const userPrefs = getGenderPreferences(user);
  const candidatePrefs = getGenderPreferences(candidate);
  const userAcceptsCandidate = userPrefs.length === 0 || userPrefs.includes(normalizeToken(candidate.gender));
  const candidateAcceptsUser = candidatePrefs.length === 0 || candidatePrefs.includes(normalizeToken(user.gender));
  return !userAcceptsCandidate || !candidateAcceptsUser;
}

function hasDealbreakerCollision(user: UserProfile, candidate: UserProfile): boolean {
  const userDealbreakers = dealbreakerMap(user);
  const candidateDealbreakers = dealbreakerMap(candidate);

  const userBlocksCandidate =
    fieldCollision(userDealbreakers, 'smoking', candidate.smoking) ||
    fieldCollision(userDealbreakers, 'drinking', candidate.drinking) ||
    fieldCollision(userDealbreakers, 'kids', candidate.kids);

  const candidateBlocksUser =
    fieldCollision(candidateDealbreakers, 'smoking', user.smoking) ||
    fieldCollision(candidateDealbreakers, 'drinking', user.drinking) ||
    fieldCollision(candidateDealbreakers, 'kids', user.kids);

  return userBlocksCandidate || candidateBlocksUser;
}

export function hasAtLeastOnePhoto(profile: UserProfile): boolean {
  return Array.isArray(profile.photos) && profile.photos.length > 0;
}

export function passesIncompleteProfileFilter(profile: UserProfile): boolean {
  return isOnboardingComplete(profile) && getProfileCompleteness(profile) >= 0.7 && hasAtLeastOnePhoto(profile);
}

export function passesHardFilters(user: UserProfile, candidate: UserProfile): boolean {
  if (intentMismatch(user, candidate)) return false;
  if (ageMismatch(user, candidate)) return false;
  if (distanceMismatch(user, candidate)) return false;
  if (genderPreferenceMismatch(user, candidate)) return false;
  if (hasDealbreakerCollision(user, candidate)) return false;
  return true;
}

function communicationScore(user: UserProfile, candidate: UserProfile): number {
  const attachment = attachmentCompatibility(user.attachmentStyle, candidate.attachmentStyle);
  const loveLanguage = loveLanguageCompatibility(user.loveLanguage, candidate.loveLanguage);
  const personality = overlapScore(user.personalityTraits, candidate.personalityTraits, 3);
  return clamp(attachment * 0.5 + loveLanguage * 0.25 + personality * 0.25);
}

function datingPaceScore(user: UserProfile, candidate: UserProfile): number {
  const goal = goalCompatibility(user.relationshipGoal, candidate.relationshipGoal);
  const activityGapDays = Math.abs(
    Math.floor((new Date(user.lastActive).getTime() - new Date(candidate.lastActive).getTime()) / (24 * 60 * 60 * 1000))
  );
  const activityScore = activityGapDays <= 2 ? 88 : activityGapDays <= 7 ? 74 : 62;
  return clamp(goal * 0.7 + activityScore * 0.3);
}

function emotionalAvailabilityScore(user: UserProfile, candidate: UserProfile): number {
  const auraDiff = Math.abs(user.auraScore - candidate.auraScore);
  const auraScore = clamp(100 - auraDiff * 1.8, 40);
  const attachment = attachmentCompatibility(user.attachmentStyle, candidate.attachmentStyle);
  return clamp(auraScore * 0.55 + attachment * 0.45);
}

export function calculateWeightedScore(user: UserProfile, candidate: UserProfile): {
  compatibilityScore: number;
  breakdown: MatchmakingBreakdown;
} {
  const values = overlapScore(user.values, candidate.values, 3);
  const communication = communicationScore(user, candidate);
  const datingPace = datingPaceScore(user, candidate);
  const lifestyle = lifestyleHabitScore(user, candidate);
  const emotional = emotionalAvailabilityScore(user, candidate);
  const interests = overlapScore(user.interests, candidate.interests, 4);
  const goals = goalCompatibility(user.relationshipGoal, candidate.relationshipGoal);

  const compatibilityScore = clamp(
    values * SCORE_WEIGHTS.values +
      communication * SCORE_WEIGHTS.communication +
      datingPace * SCORE_WEIGHTS.datingPace +
      lifestyle * SCORE_WEIGHTS.lifestyle +
      emotional * SCORE_WEIGHTS.emotional
  );

  return {
    compatibilityScore,
    breakdown: {
      values,
      communication,
      datingPace,
      lifestyle,
      interests,
      goals,
      emotional,
    },
  };
}

function pickTopSignals(breakdown: MatchmakingBreakdown): Array<[keyof MatchmakingBreakdown, number]> {
  return (Object.entries(breakdown) as Array<[keyof MatchmakingBreakdown, number]>)
    .filter(([key]) => key !== 'interests' && key !== 'goals')
    .sort((a, b) => b[1] - a[1]);
}

function reasonTemplate(dimension: keyof MatchmakingBreakdown, user: UserProfile, candidate: UserProfile, score: number): string {
  if (dimension === 'values') {
    const overlap = user.values.filter(v => candidate.values.map(normalizeToken).includes(normalizeToken(v))).slice(0, 3);
    const shared = overlap.length > 0 ? overlap.join(', ') : 'core values';
    return `You both prioritize ${shared}, which supports clearer expectations (${score}%).`;
  }

  if (dimension === 'communication') {
    return `Your communication styles align through attachment pattern and love-language fit (${score}%).`;
  }

  if (dimension === 'datingPace') {
    return `Your relationship intent and dating pace are compatible enough to move forward intentionally (${score}%).`;
  }

  if (dimension === 'lifestyle') {
    return `Lifestyle logistics are workable on distance and day-to-day habits (${score}%).`;
  }

  return `Emotional availability looks compatible for stable momentum (${score}%).`;
}

export function buildExplanation(
  user: UserProfile,
  candidate: UserProfile,
  breakdownInput?: MatchmakingBreakdown
): MatchmakingExplanation {
  const breakdown = breakdownInput ?? calculateWeightedScore(user, candidate).breakdown;
  const top = pickTopSignals(breakdown);

  const reasons: string[] = [];
  for (const [dimension, score] of top) {
    if (score < 60) continue;
    reasons.push(reasonTemplate(dimension, user, candidate, score));
    if (reasons.length >= TOP_REASON_COUNT) break;
  }

  const summary = reasons.length
    ? `Strong fit on ${top.slice(0, 2).map(([k]) => k).join(' + ')}, with clear intent alignment.`
    : 'This match lacks enough strong overlapping signals yet.';

  let worthKnowing: string | undefined;
  if (breakdown.lifestyle < 55) {
    worthKnowing = 'Worth knowing: distance or routine alignment may require extra planning.';
  } else if (breakdown.communication < 55) {
    worthKnowing = 'Worth knowing: communication style may need more explicit check-ins early on.';
  }

  return {
    summary,
    reasons,
    worthKnowing,
  };
}

function scoreFromSignals(signals: MatchmakingSignal[]): {
  signalDelta: number;
  whySignals: string[];
  confidence: 'low' | 'medium' | 'high';
} {
  let delta = 0;
  let positives = 0;
  let negatives = 0;
  const whySignals: string[] = [];

  for (const signal of signals) {
    if (signal.type === 'like' || signal.type === 'message_sent' || signal.type === 'message_received') {
      delta += 2;
      positives += 1;
    }
    if (signal.type === 'spark_answered') {
      delta += 2;
      positives += 1;
      whySignals.push('You recently exchanged meaningful spark responses.');
    }
    if (signal.type === 'date_planned') {
      delta += 4;
      positives += 1;
      whySignals.push('There is a prior date-planning signal between both profiles.');
    }
    if (signal.type === 'pass') {
      delta -= 8;
      negatives += 1;
      whySignals.push('A recent pass signal lowered near-term ranking confidence.');
    }
    if (signal.type === 'report') {
      delta -= 25;
      negatives += 1;
      whySignals.push('A safety report signal strongly reduced ranking.');
    }
  }

  const confidence = positives + negatives >= 4 ? 'high' : positives + negatives >= 2 ? 'medium' : 'low';
  return { signalDelta: delta, whySignals, confidence };
}

export function computeCandidateScore(
  user: UserProfile,
  candidate: UserProfile,
  pairSignals: MatchmakingSignal[],
  opts?: {
    completenessBonus?: number;
    mutualQueueBonus?: number;
    recencyPenalty?: number;
    tier?: 'free' | 'paid';
  }
): MatchmakingCandidateScore | null {
  const { compatibilityScore, breakdown } = calculateWeightedScore(user, candidate);
  const explanation = buildExplanation(user, candidate, breakdown);
  if (explanation.reasons.length < 3) {
    return null;
  }

  const signalAdjusted = scoreFromSignals(pairSignals);
  const rankingScore = clamp(
    compatibilityScore +
      signalAdjusted.signalDelta +
      (opts?.completenessBonus ?? 0) +
      (opts?.mutualQueueBonus ?? 0) +
      (opts?.recencyPenalty ?? 0)
  );

  return {
    userId: candidate.id,
    compatibilityScore,
    rankingScore,
    breakdown,
    reasons: explanation.reasons,
    explanation,
    whySignals: [...signalAdjusted.whySignals, `Engine ${ENGINE_VERSION} applies rule-based matching only.`],
    confidence: signalAdjusted.confidence,
    tierLabel: compatibilityScore >= 65 || opts?.tier !== 'paid' ? 'core' : 'exploratory',
    generatedAt: new Date().toISOString(),
  };
}

export const MATCHMAKING_ENGINE_VERSION = ENGINE_VERSION;
