import { CURRENT_USER, MATCHES, PROFILES } from '@/lib/mockData';
import type { Match, UserProfile } from '@/lib/types';

export interface MatchmakingRecommendation {
  userId: string;
  compatibilityScore: number;
  breakdown: {
    values: number;
    communication: number;
    lifestyle: number;
    interests: number;
    goals: number;
    emotional: number;
  };
  reasons: string[];
  whySignals: string[];
  confidence: 'low' | 'medium' | 'high';
  generatedAt: string;
}

interface MatchmakingApiResponse {
  userId: string;
  generatedAt: string;
  version: string;
  recommendations: MatchmakingRecommendation[];
}

function profileById(userId: string): UserProfile | undefined {
  if (CURRENT_USER.id === userId) return CURRENT_USER;
  return PROFILES.find(p => p.id === userId);
}

function defaultBreakdown(score: number) {
  return {
    values: Math.max(40, Math.min(100, score - 2)),
    communication: Math.max(40, Math.min(100, score + 1)),
    lifestyle: Math.max(40, Math.min(100, score - 1)),
    interests: Math.max(40, Math.min(100, score - 4)),
    goals: Math.max(40, Math.min(100, score + 2)),
    emotional: Math.max(40, Math.min(100, score)),
  };
}

function fallbackRecommendations(limit: number): MatchmakingRecommendation[] {
  return MATCHES.slice(0, limit).map(match => ({
    userId: match.profile.id,
    compatibilityScore: match.compatibilityScore,
    breakdown: match.compatibilityBreakdown,
    reasons: [match.aiReason],
    whySignals: ['Fallback from seeded local matches'],
    confidence: 'medium',
    generatedAt: new Date().toISOString(),
  }));
}

export async function runAndGetRecommendations(userId = 'user-1', limit = 10): Promise<MatchmakingRecommendation[]> {
  try {
    const post = await fetch('/api/matchmaking/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, limit }),
    });
    if (!post.ok) throw new Error('Failed to run matchmaking');
    const data = (await post.json()) as MatchmakingApiResponse;
    return data.recommendations ?? [];
  } catch {
    return fallbackRecommendations(limit);
  }
}

export function toDiscoverProfiles(recs: MatchmakingRecommendation[]): Array<{
  profile: UserProfile;
  compatibilityScore: number;
  breakdown: MatchmakingRecommendation['breakdown'];
  aiReason: string;
}> {
  return recs
    .map(rec => {
      const profile = profileById(rec.userId);
      if (!profile) return null;
      return {
        profile,
        compatibilityScore: rec.compatibilityScore,
        breakdown: rec.breakdown ?? defaultBreakdown(rec.compatibilityScore),
        aiReason:
          rec.reasons?.[0] ??
          'You both show alignment on relationship intent, communication style, and emotional pace, which can make early conversations clearer and easier to build on.',
      };
    })
    .filter(Boolean) as Array<{
    profile: UserProfile;
    compatibilityScore: number;
    breakdown: MatchmakingRecommendation['breakdown'];
    aiReason: string;
  }>;
}

export function toMatches(recs: MatchmakingRecommendation[]): Match[] {
  return recs
    .map((rec, idx) => {
      const profile = profileById(rec.userId);
      if (!profile) return null;
      const existing = MATCHES.find(m => m.profile.id === profile.id);
      return {
        id: existing?.id ?? `m-live-${profile.id}`,
        profile,
        compatibilityScore: rec.compatibilityScore,
        compatibilityBreakdown: rec.breakdown ?? defaultBreakdown(rec.compatibilityScore),
        matchedAt: existing?.matchedAt ?? new Date(Date.now() - (idx + 1) * 3600_000).toISOString(),
        aiReason:
          rec.reasons?.[0] ??
          existing?.aiReason ??
          'This match shows clear alignment in values, communication style, and future goals, with enough overlap to explore without guesswork.',
        conversation: existing?.conversation ?? [],
        isNew: existing?.isNew ?? idx < 2,
      } as Match;
    })
    .filter(Boolean) as Match[];
}

export async function ingestSignal(input: {
  actorUserId: string;
  targetUserId: string;
  type:
    | 'profile_view'
    | 'like'
    | 'pass'
    | 'message_sent'
    | 'message_received'
    | 'spark_answered'
    | 'date_planned'
    | 'report';
  metadata?: Record<string, unknown>;
}) {
  const idempotencyKey = `${input.actorUserId}-${input.targetUserId}-${input.type}-${Date.now()}`;
  try {
    await fetch('/api/matchmaking/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        idempotencyKey,
      }),
    });
  } catch {
    // Non-blocking signal ingestion
  }
}
