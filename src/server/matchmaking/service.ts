import { computeCandidateScore, MATCHMAKING_ENGINE_VERSION, passesHardFilters, passesIncompleteProfileFilter } from './engine';
import { getMatchmakingStore } from './store';
import { applyAiRankingLayer } from './ai';
import { createSupabaseServerClient } from '../../../utils/supabase/server';
import { isQaAccessEmail, normalizeEmail } from '@/lib/utils';
import type {
  MatchmakingCandidateScore,
  MatchmakingResponse,
  MatchmakingRun,
  MatchmakingSignal,
  MatchmakingTier,
} from './types';

const DEFAULT_LIMIT = 10;
const DEFAULT_LOOKBACK_DAYS = 45;
const SUPPRESSION_LOOKBACK_DAYS = 60;
const DUPLICATE_BLOCK_DAYS = 30;
const WAITLIST_MIN_POOL_SIZE_RAW = Number(process.env.MATCH_WAITLIST_MIN_POOL_SIZE ?? 20);
const WAITLIST_MIN_POOL_SIZE = Number.isFinite(WAITLIST_MIN_POOL_SIZE_RAW) && WAITLIST_MIN_POOL_SIZE_RAW > 0
  ? Math.floor(WAITLIST_MIN_POOL_SIZE_RAW)
  : 20;
const MATCH_FORCE_WAITLIST_RAW = String(process.env.MATCH_FORCE_WAITLIST ?? 'false').trim().toLowerCase();
const MATCH_WAITLIST_RELEASE_USER_COUNT_RAW = Number(process.env.MATCH_WAITLIST_RELEASE_USER_COUNT ?? 50);
const MATCH_WAITLIST_EARLY_RELEASE_USER_COUNT_RAW = Number(process.env.MATCH_WAITLIST_EARLY_RELEASE_USER_COUNT ?? 16);
const MATCH_WAITLIST_BALANCE_RATIO_RAW = Number(process.env.MATCH_WAITLIST_BALANCE_RATIO ?? 0.72);

const MATCH_WAITLIST_RELEASE_USER_COUNT =
  Number.isFinite(MATCH_WAITLIST_RELEASE_USER_COUNT_RAW) && MATCH_WAITLIST_RELEASE_USER_COUNT_RAW > 1
    ? Math.floor(MATCH_WAITLIST_RELEASE_USER_COUNT_RAW)
    : 50;
const MATCH_WAITLIST_EARLY_RELEASE_USER_COUNT =
  Number.isFinite(MATCH_WAITLIST_EARLY_RELEASE_USER_COUNT_RAW) && MATCH_WAITLIST_EARLY_RELEASE_USER_COUNT_RAW > 1
    ? Math.floor(MATCH_WAITLIST_EARLY_RELEASE_USER_COUNT_RAW)
    : 16;
const MATCH_WAITLIST_BALANCE_RATIO =
  Number.isFinite(MATCH_WAITLIST_BALANCE_RATIO_RAW) && MATCH_WAITLIST_BALANCE_RATIO_RAW > 0 && MATCH_WAITLIST_BALANCE_RATIO_RAW <= 1
    ? MATCH_WAITLIST_BALANCE_RATIO_RAW
    : 0.72;

function isGlobalWaitlistEnabled(): boolean {
  return !['0', 'false', 'off', 'no'].includes(MATCH_FORCE_WAITLIST_RAW);
}

type PoolStats = {
  total: number;
  men: number;
  women: number;
  balanceRatio: number;
};

function normalizedGender(value: unknown): 'man' | 'woman' | 'other' {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'man' || raw === 'male' || raw === 'm') return 'man';
  if (raw === 'woman' || raw === 'female' || raw === 'f') return 'woman';
  return 'other';
}

async function getPoolStats(): Promise<PoolStats> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: profiles } = await supabase
      .from('profiles')
      .select('gender,onboarding_complete')
      .eq('onboarding_complete', true)
      .returns<Array<{ gender?: string | null; onboarding_complete?: boolean | null }>>();

    const rows = profiles ?? [];
    let men = 0;
    let women = 0;
    for (const row of rows) {
      const gender = normalizedGender(row.gender);
      if (gender === 'man') men += 1;
      if (gender === 'woman') women += 1;
    }

    const total = rows.length;
    const maxCount = Math.max(men, women);
    const minCount = Math.min(men, women);
    const balanceRatio = maxCount > 0 ? minCount / maxCount : 0;
    return { total, men, women, balanceRatio };
  } catch {
    return { total: 0, men: 0, women: 0, balanceRatio: 0 };
  }
}

async function shouldAllowShowingByPool(): Promise<{ allow: boolean; stats: PoolStats }> {
  const stats = await getPoolStats();
  if (stats.total >= MATCH_WAITLIST_RELEASE_USER_COUNT) {
    return { allow: true, stats };
  }

  const balancedEnough = stats.men > 0 && stats.women > 0 && stats.balanceRatio >= MATCH_WAITLIST_BALANCE_RATIO;
  if (stats.total >= MATCH_WAITLIST_EARLY_RELEASE_USER_COUNT && balancedEnough) {
    return { allow: true, stats };
  }

  return { allow: false, stats };
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAgeBand(age: number | undefined): string {
  if (typeof age !== 'number' || Number.isNaN(age)) return 'unknown';
  if (age < 24) return '18-23';
  if (age < 30) return '24-29';
  if (age < 36) return '30-35';
  if (age < 46) return '36-45';
  return '46+';
}

function normalizeLocationBucket(location: string | undefined): string {
  if (!location) return 'global';
  const city = location.split(',')[0]?.trim().toLowerCase();
  return city && city.length > 0 ? city : 'global';
}

function segmentKeyForUser(user: Record<string, unknown>): string {
  const location = normalizeLocationBucket(typeof user.location === 'string' ? user.location : undefined);
  const intent = typeof user.relationshipGoal === 'string' ? user.relationshipGoal.toLowerCase() : 'unsure';
  const gender = typeof user.gender === 'string' ? user.gender.toLowerCase() : 'other';
  const age = typeof user.age === 'number' ? user.age : undefined;
  return [location, intent, gender, normalizeAgeBand(age)].join('|');
}

async function isWaitlistBypassUser(userId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle<{ email?: string | null }>();
    const email = normalizeEmail(data?.email ?? '');
    return isQaAccessEmail(email);
  } catch {
    return false;
  }
}

function parseTier(input: unknown): MatchmakingTier {
  // Subscription logic is disabled: app runs as free-only.
  return 'free';
}

function minimumCompatibilityScore(tier: MatchmakingTier): number {
  return 65;
}

function dailyLimitForTier(tier: MatchmakingTier): number {
  return 3;
}

function profileCompleteness(profile: Record<string, unknown>): number {
  const raw = profile.profileCompleteness ?? profile.profile_completeness ?? profile.completeness;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.min(1, raw));
  }
  return 0.7;
}

function hasPairReport(
  reports: Array<{ reporterUserId: string; targetUserId: string }>,
  userId: string,
  candidateId: string
): boolean {
  return reports.some(report => {
    const forward = report.reporterUserId === userId && report.targetUserId === candidateId;
    const backward = report.reporterUserId === candidateId && report.targetUserId === userId;
    return forward || backward;
  });
}

export async function ingestMatchmakingSignal(input: Omit<MatchmakingSignal, 'id' | 'createdAt'>) {
  const store = getMatchmakingStore();
  const existing = await store.getSignalsByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    return { accepted: true, duplicate: true, signal: existing };
  }

  const signal: MatchmakingSignal = {
    id: createId('sig'),
    createdAt: new Date().toISOString(),
    ...input,
  };

  await store.insertSignal(signal);
  return { accepted: true, duplicate: false, signal };
}

export async function getTodayMatches(userId: string, tier: MatchmakingTier): Promise<MatchmakingCandidateScore[]> {
  const store = getMatchmakingStore();
  const user = await store.getUserProfile(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const [candidates, shownHistory, blockedIds, reports] = await Promise.all([
    store.listCandidateProfiles(userId),
    store.listShownHistory(userId, SUPPRESSION_LOOKBACK_DAYS),
    store.listBlocks(userId),
    store.listReports(userId),
  ]);

  const blockedSet = new Set(blockedIds);
  const shownWithin30Days = new Set(
    shownHistory
      .filter(item => Date.now() - new Date(item.shownAt).getTime() <= DUPLICATE_BLOCK_DAYS * 24 * 60 * 60 * 1000)
      .map(item => item.candidateId)
  );
  const shownWithin60Days = new Set(shownHistory.map(item => item.candidateId));

  const eligibleCandidates = candidates
    .filter(candidate => candidate.id !== userId)
    .filter(candidate => !blockedSet.has(candidate.id))
    .filter(candidate => !hasPairReport(reports, userId, candidate.id))
    .filter(candidate => passesIncompleteProfileFilter(candidate))
    .filter(candidate => passesHardFilters(user, candidate))
    .filter(candidate => !shownWithin30Days.has(candidate.id));

  const scored: MatchmakingCandidateScore[] = [];
  const candidateById = new Map<string, typeof candidates[number]>();
  for (const candidate of eligibleCandidates) {
    const [pairSignals, alreadyQueuedForThem] = await Promise.all([
      store.listPairSignals(userId, candidate.id, DEFAULT_LOOKBACK_DAYS),
      store.isQueuedForUser(userId, candidate.id),
    ]);

    const completeness = profileCompleteness(candidate as unknown as Record<string, unknown>);
    const completenessBonus = completeness > 0.85 ? 2 : 0;
    const mutualQueueBonus = alreadyQueuedForThem ? 3 : 0;
    const recencyPenalty = shownWithin60Days.has(candidate.id) ? -10 : 0;

    const result = computeCandidateScore(user, candidate, pairSignals, {
      completenessBonus,
      mutualQueueBonus,
      recencyPenalty,
      tier,
    });

    if (!result) continue;
    scored.push(result);
    candidateById.set(candidate.id, candidate);
  }

  const filtered = scored
    .filter(item => item.compatibilityScore >= minimumCompatibilityScore(tier))
    .sort((a, b) => b.rankingScore - a.rankingScore);

  const aiPool = filtered.slice(0, 12).map(item => ({
    score: item,
    profile: candidateById.get(item.userId),
  })).filter((item): item is { score: MatchmakingCandidateScore; profile: typeof candidates[number] } => Boolean(item.profile));

  const aiLayer = await applyAiRankingLayer(user, aiPool);
  const adjusted = filtered.map(item => {
    const decision = aiLayer.byUserId.get(item.userId);
    if (!decision) return item;
    return {
      ...item,
      rankingScore: Math.max(0, Math.min(100, Math.round(item.rankingScore + decision.delta))),
      reasons: decision.summary ? [decision.summary, ...item.reasons].slice(0, 3) : item.reasons,
      explanation: {
        ...item.explanation,
        summary: decision.summary || item.explanation.summary,
        reasons: decision.reason ? [decision.reason, ...item.explanation.reasons].slice(0, 3) : item.explanation.reasons,
      },
      whySignals: [
        ...item.whySignals,
        aiLayer.applied
          ? `AI quality layer (${aiLayer.source}) adjusted ranking by ${decision.delta >= 0 ? '+' : ''}${decision.delta}.`
          : 'AI quality layer fallback: algorithm-only ranking used.',
      ],
    };
  });

  const daily = adjusted
    .sort((a, b) => b.rankingScore - a.rankingScore)
    .slice(0, dailyLimitForTier(tier));

  if (daily.length > 0) {
    await store.saveShownHistory(
      daily.map(item => ({
        userId,
        candidateId: item.userId,
        shownAt: new Date().toISOString(),
      }))
    );
  }

  return daily;
}

export async function runMatchmaking(
  userId: string,
  limit = DEFAULT_LIMIT,
  tierInput: MatchmakingTier = 'free'
): Promise<MatchmakingResponse> {
  const start = Date.now();
  const store = getMatchmakingStore();
  const tier = parseTier(tierInput);

  const user = await store.getUserProfile(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const recommendations = await getTodayMatches(userId, tier);
  const limited = recommendations.slice(0, Math.max(1, Math.min(50, limit)));
  let waitlist = null;
  const bypassWaitlist = await isWaitlistBypassUser(userId);
  const forceWaitlist = isGlobalWaitlistEnabled();
  const poolGate = await shouldAllowShowingByPool();
  const shouldWaitlist = !bypassWaitlist && (forceWaitlist || !poolGate.allow);

  if (shouldWaitlist) {
    waitlist = await store.upsertWaitlistEntry({
      userId,
      segment: segmentKeyForUser(user as unknown as Record<string, unknown>),
      minPoolSize: WAITLIST_MIN_POOL_SIZE,
      scoreSnapshot: {
        eligibleMatchesNow: recommendations.length,
        tier,
        poolTotal: poolGate.stats.total,
        poolMen: poolGate.stats.men,
        poolWomen: poolGate.stats.women,
        poolBalanceRatio: Number(poolGate.stats.balanceRatio.toFixed(3)),
      },
    });
    await store.saveRecommendations(userId, []);
  } else {
    await store.saveRecommendations(userId, limited);
    await store.markWaitlistReleased(userId);
  }

  const run: MatchmakingRun = {
    id: createId('run'),
    userId,
    candidateCount: recommendations.length,
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    version: MATCHMAKING_ENGINE_VERSION,
  };
  await store.saveRun(run);

  return {
    userId,
    tier,
    generatedAt: run.createdAt,
    version: MATCHMAKING_ENGINE_VERSION,
    recommendations: waitlist ? [] : limited,
    waitlist,
  };
}

export async function getMatchmakingRecommendations(
  userId: string,
  limit = DEFAULT_LIMIT,
  tierInput: MatchmakingTier = 'free'
): Promise<MatchmakingResponse> {
  const store = getMatchmakingStore();
  const tier = parseTier(tierInput);
  const bypassWaitlist = await isWaitlistBypassUser(userId);
  const forceWaitlist = isGlobalWaitlistEnabled();
  const poolGate = await shouldAllowShowingByPool();
  const shouldWaitlist = !bypassWaitlist && (forceWaitlist || !poolGate.allow);

  if (shouldWaitlist) {
    return {
      userId,
      tier,
      generatedAt: new Date().toISOString(),
      version: MATCHMAKING_ENGINE_VERSION,
      recommendations: [],
      waitlist: await store.getWaitlistEntry(userId),
    };
  }

  const recommendations = await store.getRecommendations(userId, limit);
  const waitlist = recommendations.length === 0 ? await store.getWaitlistEntry(userId) : null;
  if (recommendations.length > 0) {
    await store.markWaitlistReleased(userId);
  }
  return {
    userId,
    tier,
    generatedAt: new Date().toISOString(),
    version: MATCHMAKING_ENGINE_VERSION,
    recommendations,
    waitlist,
  };
}
