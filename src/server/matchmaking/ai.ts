import type { UserProfile } from '@/lib/types';
import type { MatchmakingCandidateScore } from './types';

type AiDecision = {
  userId: string;
  delta: number;
  summary?: string;
  reason?: string;
};

type AiLayerResult = {
  applied: boolean;
  source: 'openai' | 'anthropic' | 'fallback';
  byUserId: Map<string, AiDecision>;
};

function clampDelta(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-8, Math.min(8, Math.round(value)));
}

function parseDecisions(input: unknown): AiDecision[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const userId = typeof row.userId === 'string' ? row.userId.trim() : '';
      if (!userId) return null;
      const deltaRaw = typeof row.delta === 'number' ? row.delta : Number(row.delta ?? 0);
      const summary = typeof row.summary === 'string' ? row.summary.trim() : undefined;
      const reason = typeof row.reason === 'string' ? row.reason.trim() : undefined;
      return {
        userId,
        delta: clampDelta(deltaRaw),
        summary,
        reason,
      };
    })
    .filter(Boolean) as AiDecision[];
}

function parseJsonEnvelope(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    return null;
  }
}

async function callOpenAI(prompt: string): Promise<AiDecision[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content:
            'You are a matchmaking quality layer. Keep hard filters untouched. Return strict JSON array only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) return null;
  return parseDecisions(parseJsonEnvelope(text));
}

async function callAnthropic(prompt: string): Promise<AiDecision[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-6';
  const message = await client.messages.create({
    model,
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  if (!text) return null;
  return parseDecisions(parseJsonEnvelope(text));
}

function buildPrompt(user: UserProfile, candidates: Array<{ profile: UserProfile; score: MatchmakingCandidateScore }>) {
  const payload = candidates.map(item => ({
    userId: item.profile.id,
    compatibilityScore: item.score.compatibilityScore,
    rankingScore: item.score.rankingScore,
    breakdown: item.score.breakdown,
    reasons: item.score.reasons.slice(0, 3),
    profile: {
      age: item.profile.age,
      location: item.profile.location,
      relationshipGoal: item.profile.relationshipGoal,
      interests: item.profile.interests.slice(0, 6),
      values: item.profile.values.slice(0, 6),
      personalityTraits: item.profile.personalityTraits.slice(0, 6),
      bio: item.profile.bio.slice(0, 240),
      lastActive: item.profile.lastActive,
    },
  }));

  return `You are a ranking quality layer for dating matches.
Viewer:
${JSON.stringify({
    id: user.id,
    age: user.age,
    relationshipGoal: user.relationshipGoal,
    location: user.location,
    interests: user.interests.slice(0, 8),
    values: user.values.slice(0, 8),
    personalityTraits: user.personalityTraits.slice(0, 8),
    bio: user.bio.slice(0, 240),
  })}

Candidates:
${JSON.stringify(payload)}

Task:
- Keep eligibility unchanged. Do NOT remove hard filters.
- For each candidate, return a small ranking delta from -8 to +8 based on nuance, conversational fit, and likely real-world connection quality.
- Include a short summary and one reason.
- Prefer quality over quantity. Penalize shallow/low-depth fit.

Return strict JSON array only:
[
  { "userId": "id", "delta": 3, "summary": "short text", "reason": "short reason" }
]`;
}

export async function applyAiRankingLayer(
  user: UserProfile,
  candidates: Array<{ profile: UserProfile; score: MatchmakingCandidateScore }>
): Promise<AiLayerResult> {
  if (!candidates.length) {
    return { applied: false, source: 'fallback', byUserId: new Map() };
  }

  const prompt = buildPrompt(user, candidates);

  try {
    const openAi = await callOpenAI(prompt);
    if (openAi && openAi.length > 0) {
      return {
        applied: true,
        source: 'openai',
        byUserId: new Map(openAi.map(item => [item.userId, item])),
      };
    }
  } catch {
    // silent fallback
  }

  try {
    const anthropic = await callAnthropic(prompt);
    if (anthropic && anthropic.length > 0) {
      return {
        applied: true,
        source: 'anthropic',
        byUserId: new Map(anthropic.map(item => [item.userId, item])),
      };
    }
  } catch {
    // silent fallback
  }

  return {
    applied: false,
    source: 'fallback',
    byUserId: new Map(),
  };
}
