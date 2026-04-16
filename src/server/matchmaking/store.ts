import { CURRENT_USER, MATCHES, PROFILES } from '@/lib/mockData';
import type { UserProfile } from '@/lib/types';
import type {
  MatchmakingCandidateScore,
  MatchmakingRun,
  MatchmakingSignal,
  MatchmakingStore,
  MatchShownHistory,
  UserReport,
} from './types';

declare global {
  var __vinculoMatchStore:
    | {
        signals: MatchmakingSignal[];
        recs: Map<string, MatchmakingCandidateScore[]>;
        runs: MatchmakingRun[];
        shownHistory: MatchShownHistory[];
        blocks: Array<{ blockerUserId: string; blockedUserId: string }>;
        reports: UserReport[];
      }
    | undefined;
}

function getState() {
  if (!globalThis.__vinculoMatchStore) {
    globalThis.__vinculoMatchStore = {
      signals: [],
      recs: new Map<string, MatchmakingCandidateScore[]>(),
      runs: [],
      shownHistory: [],
      blocks: [],
      reports: [],
    };
  }
  return globalThis.__vinculoMatchStore;
}

const ALL_USERS: UserProfile[] = [CURRENT_USER, ...PROFILES];

function seededRecommendation(match: (typeof MATCHES)[number]): MatchmakingCandidateScore {
  const breakdown = {
    ...match.compatibilityBreakdown,
    datingPace: match.compatibilityBreakdown.goals,
  };
  const reasons = [
    `Intent alignment and communication fit are both strong in this match (${match.compatibilityScore}%).`,
    `Lifestyle and routine compatibility score high for practical dating momentum.`,
    `Shared values and emotional alignment suggest lower ambiguity early on.`,
  ];

  return {
    userId: match.profile.id,
    compatibilityScore: match.compatibilityScore,
    rankingScore: match.compatibilityScore,
    breakdown,
    reasons,
    explanation: {
      summary: match.aiReason,
      reasons,
    },
    whySignals: ['Seeded from existing compatibility dataset'],
    confidence: 'medium',
    tierLabel: 'core',
    generatedAt: new Date().toISOString(),
  };
}

export class InMemoryMatchmakingStore implements MatchmakingStore {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return ALL_USERS.find(u => u.id === userId) ?? null;
  }

  async listCandidateProfiles(userId: string): Promise<UserProfile[]> {
    return ALL_USERS.filter(u => u.id !== userId);
  }

  async listShownHistory(userId: string, lookbackDays: number): Promise<MatchShownHistory[]> {
    const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    const state = getState();
    return state.shownHistory.filter(item => {
      if (item.userId !== userId) return false;
      return new Date(item.shownAt).getTime() >= cutoff;
    });
  }

  async listBlocks(userId: string): Promise<string[]> {
    const state = getState();
    const blockedByUser = state.blocks.filter(b => b.blockerUserId === userId).map(b => b.blockedUserId);
    const blockedUser = state.blocks.filter(b => b.blockedUserId === userId).map(b => b.blockerUserId);
    return Array.from(new Set([...blockedByUser, ...blockedUser]));
  }

  async listReports(userId: string): Promise<UserReport[]> {
    const state = getState();
    return state.reports.filter(r => r.reporterUserId === userId || r.targetUserId === userId);
  }

  async isQueuedForUser(userId: string, candidateId: string): Promise<boolean> {
    const state = getState();
    const candidateQueue = state.recs.get(candidateId) ?? [];
    return candidateQueue.some(entry => entry.userId === userId);
  }

  async saveShownHistory(entries: MatchShownHistory[]): Promise<void> {
    const state = getState();
    state.shownHistory.push(...entries);
  }

  async listPairSignals(userId: string, candidateId: string, lookbackDays: number): Promise<MatchmakingSignal[]> {
    const state = getState();
    const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    return state.signals.filter(signal => {
      const ts = new Date(signal.createdAt).getTime();
      if (ts < cutoff) return false;
      const isForward = signal.actorUserId === userId && signal.targetUserId === candidateId;
      const isBackward = signal.actorUserId === candidateId && signal.targetUserId === userId;
      return isForward || isBackward;
    });
  }

  async getSignalsByIdempotencyKey(idempotencyKey: string): Promise<MatchmakingSignal | null> {
    const state = getState();
    return state.signals.find(signal => signal.idempotencyKey === idempotencyKey) ?? null;
  }

  async insertSignal(signal: MatchmakingSignal): Promise<void> {
    const state = getState();
    state.signals.push(signal);

    if (signal.type === 'report') {
      state.reports.push({
        reporterUserId: signal.actorUserId,
        targetUserId: signal.targetUserId,
        createdAt: signal.createdAt,
      });
    }
  }

  async saveRun(run: MatchmakingRun): Promise<void> {
    const state = getState();
    state.runs.push(run);
  }

  async saveRecommendations(userId: string, recommendations: MatchmakingCandidateScore[]): Promise<void> {
    const state = getState();
    state.recs.set(userId, recommendations);
  }

  async getRecommendations(userId: string, limit: number): Promise<MatchmakingCandidateScore[]> {
    const state = getState();
    const existing = state.recs.get(userId);
    if (existing?.length) return existing.slice(0, limit);

    const seeded = MATCHES.map(match => seededRecommendation(match));
    state.recs.set(userId, seeded);
    return seeded.slice(0, limit);
  }
}

export function getMatchmakingStore(): MatchmakingStore {
  return new InMemoryMatchmakingStore();
}
