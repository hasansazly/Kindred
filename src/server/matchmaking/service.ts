import { computeCandidateScore, MATCHMAKING_ENGINE_VERSION, passesHardFilters, passesIncompleteProfileFilter } from './engine';
import { getMatchmakingStore } from './store';
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

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseTier(input: unknown): MatchmakingTier {
  return input === 'paid' ? 'paid' : 'free';
}

function minimumCompatibilityScore(tier: MatchmakingTier): number {
  return tier === 'paid' ? 50 : 65;
}

function dailyLimitForTier(tier: MatchmakingTier): number {
  return tier === 'paid' ? 6 : 3;
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
  }

  const filtered = scored
    .filter(item => item.compatibilityScore >= minimumCompatibilityScore(tier))
    .sort((a, b) => b.rankingScore - a.rankingScore)
    .slice(0, dailyLimitForTier(tier));

  if (filtered.length > 0) {
    await store.saveShownHistory(
      filtered.map(item => ({
        userId,
        candidateId: item.userId,
        shownAt: new Date().toISOString(),
      }))
    );
  }

  return filtered;
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

  await store.saveRecommendations(userId, limited);

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
    recommendations: limited,
  };
}

export async function getMatchmakingRecommendations(
  userId: string,
  limit = DEFAULT_LIMIT,
  tierInput: MatchmakingTier = 'free'
): Promise<MatchmakingResponse> {
  const store = getMatchmakingStore();
  const tier = parseTier(tierInput);

  const recommendations = await store.getRecommendations(userId, limit);
  return {
    userId,
    tier,
    generatedAt: new Date().toISOString(),
    version: MATCHMAKING_ENGINE_VERSION,
    recommendations,
  };
}
