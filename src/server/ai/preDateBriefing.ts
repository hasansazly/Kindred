import type { SupabaseClient } from '@supabase/supabase-js';
import type { MatchView } from '@/lib/matches';

export type PreDateBriefing = {
  connection_summary: string;
  shared_points: string[];
  conversation_starters: string[];
  mindful_note: string;
  date_idea: string;
  communication_tip: string;
  disclaimer: string;
};

export type PreDateBriefingResult = {
  status: 'ok' | 'unavailable';
  source: 'cache' | 'ai' | 'fallback';
  briefing: PreDateBriefing | null;
  reason?: string;
};

type ProfileMini = {
  first_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  interests?: unknown;
  core_values?: unknown;
  relationship_intent?: string | null;
  bio?: string | null;
};

type OnboardingRow = {
  category: string;
  response: unknown;
};

type MessageRow = {
  body: string;
};

type BriefingRow = {
  briefing: unknown;
  provider?: string | null;
  created_at?: string | null;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

function enabled(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const v = raw.trim().toLowerCase();
  return !(v === '0' || v === 'false' || v === 'off' || v === 'no');
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => typeof item === 'string').map(v => String(v).trim()).filter(Boolean);
}

function safeLine(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  return v.length > 0 ? v : fallback;
}

function toName(profile: ProfileMini | null | undefined): string {
  const fromFields = [profile?.first_name, profile?.full_name].find(v => typeof v === 'string' && v.trim().length > 0);
  if (fromFields) return (fromFields as string).trim().split(/\s+/)[0] || 'Match';
  if (typeof profile?.email === 'string') {
    const prefix = profile.email.split('@')[0]?.trim();
    if (prefix) return prefix;
  }
  return 'Match';
}

function pickFromMap(map: Map<string, Record<string, unknown>>, key: string, fields: string[]): string[] {
  const row = map.get(key) ?? {};
  const result: string[] = [];
  for (const field of fields) {
    result.push(...toStringArray((row as Record<string, unknown>)[field]));
  }
  return result;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string): boolean {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
}

function sanitizeBriefing(input: unknown): PreDateBriefing | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as Record<string, unknown>;

  const shared = Array.isArray(obj.shared_points)
    ? obj.shared_points.filter(item => typeof item === 'string').slice(0, 3) as string[]
    : [];
  const starters = Array.isArray(obj.conversation_starters)
    ? obj.conversation_starters.filter(item => typeof item === 'string').slice(0, 3) as string[]
    : [];

  const briefing: PreDateBriefing = {
    connection_summary: safeLine(obj.connection_summary, 'Based on what you both shared, there is enough overlap to have a grounded first date.'),
    shared_points: shared.length > 0 ? shared : ['Shared intent to explore this match thoughtfully.'],
    conversation_starters: starters.length > 0 ? starters : ['What has felt most energizing in your week so far?'],
    mindful_note: safeLine(obj.mindful_note, 'You may differ in pace, so check in early about comfort and timing.'),
    date_idea: safeLine(obj.date_idea, 'Try a low-pressure coffee or walk where conversation can flow naturally.'),
    communication_tip: safeLine(obj.communication_tip, 'Keep your tone clear and warm, and ask one direct question before assuming intent.'),
    disclaimer: 'This is a lightweight guide based on what you both shared, not a prediction.',
  };

  return briefing;
}

function buildFallbackBriefing(params: {
  viewerName: string;
  otherName: string;
  sharedInterests: string[];
  sharedValues: string[];
  relationshipIntent: string;
  compatibilityReasons: string[];
}): PreDateBriefing {
  const sharedItems = [...params.sharedInterests.slice(0, 2), ...params.sharedValues.slice(0, 2)];
  const safeShared = sharedItems.length > 0 ? sharedItems : params.compatibilityReasons.slice(0, 3);

  return {
    connection_summary: `Based on what you both shared, ${params.viewerName} and ${params.otherName} may connect through aligned intent and conversation style.`,
    shared_points: safeShared.length > 0 ? safeShared.slice(0, 3) : ['Intentional communication', 'Clear relationship goals', 'Value alignment'],
    conversation_starters: [
      'What kind of week feels balanced for you right now?',
      'What helps you feel comfortable on a first date?',
      'What does good communication look like to you early on?',
    ],
    mindful_note: 'You may not share the same pace at first, so a quick check-in on expectations can keep the date comfortable.',
    date_idea: 'Try a relaxed coffee + short walk plan so you can talk naturally without pressure.',
    communication_tip: `Since intent is ${params.relationshipIntent || 'still evolving'}, keep the tone warm and direct, and avoid over-reading early signals.`,
    disclaimer: 'This is a lightweight guide based on what you both shared, not a prediction.',
  };
}

async function callOpenAI(model: string, prompt: string): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content:
              'You write brief, respectful, non-invasive first-date guidance. Use only provided data. Return strict JSON only.',
          },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI request failed (${res.status}): ${body}`);
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }
      return null;
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function getRecentConversationSnippets(
  supabase: SupabaseClient,
  viewerUserId: string,
  otherUserId: string
): Promise<string[]> {
  const { data: mine } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', viewerUserId)
    .returns<Array<{ conversation_id: string }>>();

  const conversationIds = (mine ?? []).map(row => row.conversation_id);
  if (conversationIds.length === 0) return [];

  const { data: shared } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', otherUserId)
    .in('conversation_id', conversationIds)
    .returns<Array<{ conversation_id: string }>>();

  const conversationId = (shared ?? [])[0]?.conversation_id;
  if (!conversationId) return [];

  const { data: messages } = await supabase
    .from('messages')
    .select('body')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(8)
    .returns<MessageRow[]>();

  return (messages ?? [])
    .map(msg => msg.body)
    .filter(body => typeof body === 'string' && body.trim().length > 0)
    .slice(0, 6);
}

export async function getPreDateBriefingForMatch(params: {
  supabase: SupabaseClient;
  viewerUserId: string;
  match: MatchView;
}): Promise<PreDateBriefingResult> {
  const { supabase, viewerUserId, match } = params;

  if (!enabled('AI_PRE_DATE_BRIEFING_ENABLED', true)) {
    return { status: 'unavailable', source: 'fallback', briefing: null, reason: 'disabled' };
  }

  if (!match.isMutualMatch) {
    return { status: 'unavailable', source: 'fallback', briefing: null, reason: 'mutual_match_required' };
  }

  const otherUserId = match.matchedUserId;
  const key = pairKey(viewerUserId, otherUserId);

  // cache read (table optional)
  const { data: cachedRow, error: cacheReadError } = await supabase
    .from('pre_date_briefings')
    .select('briefing,provider,created_at')
    .eq('pair_key', key)
    .maybeSingle<BriefingRow>();

  if (!cacheReadError && cachedRow?.briefing) {
    const createdAt = cachedRow.created_at ? new Date(cachedRow.created_at).getTime() : 0;
    if (createdAt > 0 && Date.now() - createdAt < CACHE_TTL_MS) {
      const parsed = sanitizeBriefing(cachedRow.briefing);
      if (parsed) {
        return { status: 'ok', source: 'cache', briefing: parsed };
      }
    }
  }

  const profiles = await Promise.all([
    supabase.from('profiles').select('first_name,full_name,email,interests,core_values,relationship_intent,bio').eq('id', viewerUserId).maybeSingle<ProfileMini>(),
    supabase.from('profiles').select('first_name,full_name,email,interests,core_values,relationship_intent,bio').eq('id', otherUserId).maybeSingle<ProfileMini>(),
    supabase.from('onboarding_responses').select('category,response').eq('user_id', viewerUserId).in('category', ['values', 'demographics', 'communication_style']).returns<OnboardingRow[]>(),
    supabase.from('onboarding_responses').select('category,response').eq('user_id', otherUserId).in('category', ['values', 'demographics', 'communication_style']).returns<OnboardingRow[]>(),
  ]);

  const viewerProfile = profiles[0].data ?? null;
  const otherProfile = profiles[1].data ?? null;
  const viewerRows = profiles[2].data ?? [];
  const otherRows = profiles[3].data ?? [];

  const viewerMap = new Map<string, Record<string, unknown>>();
  for (const row of viewerRows) {
    if (row && typeof row.response === 'object' && row.response !== null) viewerMap.set(row.category, row.response as Record<string, unknown>);
  }
  const otherMap = new Map<string, Record<string, unknown>>();
  for (const row of otherRows) {
    if (row && typeof row.response === 'object' && row.response !== null) otherMap.set(row.category, row.response as Record<string, unknown>);
  }

  const viewerInterests = Array.from(new Set([
    ...toStringArray(viewerProfile?.interests),
    ...pickFromMap(viewerMap, 'demographics', ['interests']),
  ])).slice(0, 8);

  const otherInterests = Array.from(new Set([
    ...toStringArray(otherProfile?.interests),
    ...pickFromMap(otherMap, 'demographics', ['interests']),
  ])).slice(0, 8);

  const viewerValues = Array.from(new Set([
    ...toStringArray(viewerProfile?.core_values),
    ...pickFromMap(viewerMap, 'values', ['values']),
  ])).slice(0, 8);

  const otherValues = Array.from(new Set([
    ...toStringArray(otherProfile?.core_values),
    ...pickFromMap(otherMap, 'values', ['values']),
  ])).slice(0, 8);

  const sharedInterests = viewerInterests.filter(item => otherInterests.map(v => v.toLowerCase()).includes(item.toLowerCase())).slice(0, 3);
  const sharedValues = viewerValues.filter(item => otherValues.map(v => v.toLowerCase()).includes(item.toLowerCase())).slice(0, 3);

  const relationshipIntent =
    (otherProfile?.relationship_intent ?? viewerProfile?.relationship_intent ?? match.matchedProfile.relationshipIntent ?? '').trim();

  const recentMessages = await getRecentConversationSnippets(supabase, viewerUserId, otherUserId);

  const fallback = buildFallbackBriefing({
    viewerName: toName(viewerProfile),
    otherName: toName(otherProfile),
    sharedInterests,
    sharedValues,
    relationshipIntent,
    compatibilityReasons: match.compatibilityReasons,
  });

  let finalBriefing = fallback;
  let source: 'ai' | 'fallback' = 'fallback';

  if (process.env.OPENAI_API_KEY) {
    const prompt = `Create a short first-date briefing.
Use only the provided fields.
Do not claim certainty or hidden psychological knowledge.
Do not infer feelings not explicitly supported.
Tone: warm, practical, respectful.
Keep each field concise.

Return strict JSON with keys:
connection_summary (string)
shared_points (array of 3 short strings)
conversation_starters (array of 3 short strings)
mindful_note (string)
date_idea (string)
communication_tip (string)

Viewer profile summary:
- relationship_intent: ${JSON.stringify(viewerProfile?.relationship_intent ?? '')}
- top interests: ${JSON.stringify(viewerInterests)}
- top values: ${JSON.stringify(viewerValues)}

Match profile summary:
- relationship_intent: ${JSON.stringify(otherProfile?.relationship_intent ?? '')}
- top interests: ${JSON.stringify(otherInterests)}
- top values: ${JSON.stringify(otherValues)}
- short bio: ${JSON.stringify(otherProfile?.bio ?? '')}

Match context:
- compatibility_reasons: ${JSON.stringify(match.compatibilityReasons.slice(0, 4))}
- explanation: ${JSON.stringify(match.explanation)}
- recent_message_snippets: ${JSON.stringify(recentMessages)}
`;

    try {
      const raw = await callOpenAI(process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini', prompt);
      const parsed = sanitizeBriefing(raw);
      if (parsed) {
        finalBriefing = parsed;
        source = 'ai';
      }
    } catch (error) {
      console.error('[pre-date-briefing] generation_failed', error);
    }
  }

  // cache write (table optional)
  const payload = {
    pair_key: key,
    user_one_id: [viewerUserId, otherUserId].sort()[0],
    user_two_id: [viewerUserId, otherUserId].sort()[1],
    match_id: match.id,
    briefing: finalBriefing,
    provider: source,
    model: source === 'ai' ? (process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini') : null,
  };

  const { error: cacheWriteError } = await supabase
    .from('pre_date_briefings')
    .upsert(payload, { onConflict: 'pair_key' });

  if (cacheWriteError && !looksLikeMissingTable(cacheWriteError, 'pre_date_briefings')) {
    console.error('[pre-date-briefing] cache_write_failed', cacheWriteError.message);
  }

  return { status: 'ok', source, briefing: finalBriefing };
}
