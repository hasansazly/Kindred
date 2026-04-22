import type { SupabaseClient } from '@supabase/supabase-js';
import { getActivitySuggestionFromProfile, type IRLActivitySuggestionCard } from '@/lib/irl/activitySuggestions';

type MatchRow = {
  id: string;
  user_id: string;
  matched_user_id: string;
  status: string;
  irl_unlocked_at: string | null;
};

type ConnectionTrackRow = {
  id: string;
  user_one_id: string;
  user_two_id: string;
  status: 'active' | 'inactive';
};

type DailyResponseRow = {
  user_id: string;
  created_at: string;
};

type ReadinessRow = {
  user_id: string;
  ready_at: string;
};

type IntentionRow = {
  user_id: string;
  answers: Record<string, unknown> | null;
  submitted_at: string;
  revealed_at: string | null;
};

type ReflectionRow = {
  id: string;
  feeling: string;
  note: string | null;
  submitted_at: string;
};

type MatchPreferenceRow = {
  user_id: string;
  values: string[] | null;
  communication_style: string | null;
};

type OnboardingRow = {
  user_id: string;
  category: string;
  response: Record<string, unknown> | null;
};

export type IrlMatchContext = {
  matchId: string;
  viewerUserId: string;
  otherUserId: string;
  participantUserIds: [string, string];
  irlUnlockedAt: string | null;
};

export type IrlReadinessStatus = {
  featureEnabled: boolean;
  matchId: string;
  viewerUserId: string;
  participantUserIds: string[];
  connectionTrackDays: number;
  unlocked: boolean;
  irlUnlockedAt: string | null;
  readyUserIds: string[];
  bothReady: boolean;
  suggestion: IRLActivitySuggestionCard;
};

export type IrlIntentionStatus = {
  featureEnabled: boolean;
  matchId: string;
  submittedUserIds: string[];
  bothSubmitted: boolean;
  answersVisible: boolean;
  answersByUser: Record<string, Record<string, unknown>> | null;
  revealedAt: string | null;
  bothSubmittedAt: string | null;
  reflectionDueAt: string | null;
  myReflectionSubmitted: boolean;
  myReflection: ReflectionRow | null;
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean);
}

function extractValuesFromResponse(response: Record<string, unknown> | null | undefined): string[] {
  if (!response) return [];
  return normalizeStringArray(response.values);
}

function extractCommunicationFromResponse(response: Record<string, unknown> | null | undefined): string[] {
  if (!response) return [];
  const candidates = [response.communicationStyle, response.communication_style, response.style];
  return candidates.filter(item => typeof item === 'string').map(item => String(item).trim()).filter(Boolean);
}

function toUtcDay(ts: string) {
  const date = new Date(ts);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function dayDiff(prevDay: string, nextDay: string) {
  const prevTs = Date.parse(`${prevDay}T00:00:00.000Z`);
  const nextTs = Date.parse(`${nextDay}T00:00:00.000Z`);
  if (!Number.isFinite(prevTs) || !Number.isFinite(nextTs)) return Number.NaN;
  return Math.round((nextTs - prevTs) / (24 * 60 * 60 * 1000));
}

function maxConsecutiveDays(days: string[]) {
  if (days.length === 0) return 0;
  const sorted = [...days].sort((a, b) => a.localeCompare(b));
  let max = 1;
  let streak = 1;

  for (let idx = 1; idx < sorted.length; idx += 1) {
    const prev = sorted[idx - 1];
    const current = sorted[idx];
    if (!prev || !current) continue;

    if (dayDiff(prev, current) === 1) {
      streak += 1;
    } else {
      streak = 1;
    }

    if (streak > max) max = streak;
  }

  return max;
}

export async function resolveIrlMatchContext(
  supabase: SupabaseClient,
  viewerUserId: string,
  matchId: string
): Promise<IrlMatchContext | null> {
  const { data: match, error } = await supabase
    .from('matches')
    .select('id,user_id,matched_user_id,status,irl_unlocked_at')
    .eq('id', matchId)
    .eq('status', 'active')
    .or(`user_id.eq.${viewerUserId},matched_user_id.eq.${viewerUserId}`)
    .maybeSingle<MatchRow>();

  if (error || !match) {
    return null;
  }

  const otherUserId = match.user_id === viewerUserId ? match.matched_user_id : match.user_id;
  if (!otherUserId || otherUserId === viewerUserId) return null;

  const participantUserIds: [string, string] = [match.user_id, match.matched_user_id];

  return {
    matchId: match.id,
    viewerUserId,
    otherUserId,
    participantUserIds,
    irlUnlockedAt: match.irl_unlocked_at,
  };
}

export async function getConnectionTrackConsecutiveDays(supabase: SupabaseClient, matchId: string) {
  const { data: track } = await supabase
    .from('connection_tracks')
    .select('id,user_one_id,user_two_id,status')
    .eq('match_id', matchId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<ConnectionTrackRow>();

  if (!track) return 0;

  const { data: rows, error } = await supabase
    .from('connection_track_responses')
    .select('user_id,created_at,connection_track_questions!inner(type)')
    .eq('connection_track_id', track.id)
    .eq('connection_track_questions.type', 'daily_micro_question')
    .returns<DailyResponseRow[]>();

  if (error || !rows || rows.length === 0) return 0;

  const participants = new Set([track.user_one_id, track.user_two_id]);
  const byDay = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!participants.has(row.user_id)) continue;
    const day = toUtcDay(row.created_at);
    if (!day) continue;
    const existing = byDay.get(day) ?? new Set<string>();
    existing.add(row.user_id);
    byDay.set(day, existing);
  }

  const completeDays = Array.from(byDay.entries())
    .filter(([, users]) => users.size >= 2)
    .map(([day]) => day);

  return maxConsecutiveDays(completeDays);
}

export async function ensureIrlUnlocked(
  supabase: SupabaseClient,
  context: IrlMatchContext,
  connectionTrackDays: number
): Promise<string | null> {
  if (context.irlUnlockedAt) return context.irlUnlockedAt;
  if (connectionTrackDays < 3) return null;

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('matches')
    .update({ irl_unlocked_at: nowIso })
    .eq('id', context.matchId)
    .is('irl_unlocked_at', null);

  if (!error) {
    context.irlUnlockedAt = nowIso;
    return nowIso;
  }

  return null;
}

export async function getIrlReadinessStatus(
  supabase: SupabaseClient,
  context: IrlMatchContext,
  opts?: { featureEnabled?: boolean }
): Promise<IrlReadinessStatus> {
  const featureEnabled = Boolean(opts?.featureEnabled);
  const connectionTrackDays = await getConnectionTrackConsecutiveDays(supabase, context.matchId);
  const unlockedAt = await ensureIrlUnlocked(supabase, context, connectionTrackDays);
  const unlocked = Boolean(unlockedAt || context.irlUnlockedAt || connectionTrackDays >= 3);

  const [{ data: readinessRows }, suggestion] = await Promise.all([
    supabase
      .from('irl_readiness')
      .select('user_id,ready_at')
      .eq('match_id', context.matchId)
      .returns<ReadinessRow[]>(),
    getSuggestionForMatch(supabase, context),
  ]);

  const readyUserIds = Array.from(new Set((readinessRows ?? []).map(row => row.user_id))).filter(userId =>
    context.participantUserIds.includes(userId)
  );
  const bothReady = context.participantUserIds.every(userId => readyUserIds.includes(userId));

  return {
    featureEnabled,
    matchId: context.matchId,
    viewerUserId: context.viewerUserId,
    participantUserIds: [...context.participantUserIds],
    connectionTrackDays,
    unlocked,
    irlUnlockedAt: unlockedAt ?? context.irlUnlockedAt,
    readyUserIds,
    bothReady,
    suggestion,
  };
}

async function getSuggestionForMatch(supabase: SupabaseClient, context: IrlMatchContext) {
  const [{ data: preferenceRows }, { data: onboardingRows }] = await Promise.all([
    supabase
      .from('match_preferences')
      .select('user_id,values,communication_style')
      .in('user_id', [...context.participantUserIds])
      .returns<MatchPreferenceRow[]>(),
    supabase
      .from('onboarding_responses')
      .select('user_id,category,response')
      .in('user_id', [...context.participantUserIds])
      .in('category', ['values', 'communication_style'])
      .returns<OnboardingRow[]>(),
  ]);

  const prefByUser = new Map((preferenceRows ?? []).map(row => [row.user_id, row]));
  const onboardingByUser = new Map<string, OnboardingRow[]>();

  for (const row of onboardingRows ?? []) {
    const current = onboardingByUser.get(row.user_id) ?? [];
    current.push(row);
    onboardingByUser.set(row.user_id, current);
  }

  const perUserValues: string[][] = [];
  const perUserComms: string[] = [];

  for (const userId of context.participantUserIds) {
    const pref = prefByUser.get(userId);
    const rows = onboardingByUser.get(userId) ?? [];

    const valuesFromOnboarding = rows
      .filter(row => row.category === 'values')
      .flatMap(row => extractValuesFromResponse(row.response));
    const values = Array.from(new Set([...(pref?.values ?? []), ...valuesFromOnboarding])).filter(Boolean);

    const commFromOnboarding = rows
      .filter(row => row.category === 'communication_style')
      .flatMap(row => extractCommunicationFromResponse(row.response));

    const communication = [pref?.communication_style ?? '', ...commFromOnboarding].find(Boolean) ?? '';

    perUserValues.push(values);
    perUserComms.push(communication);
  }

  const [firstValues, secondValues] = perUserValues;
  const overlap = (firstValues ?? []).filter(value => (secondValues ?? []).includes(value));
  const mergedValues = overlap.length > 0 ? overlap : Array.from(new Set([...(firstValues ?? []), ...(secondValues ?? [])]));
  const communicationStyle = perUserComms.find(Boolean) ?? 'intentional';

  return getActivitySuggestionFromProfile({
    values: mergedValues.slice(0, 8),
    communicationStyle,
  });
}

export async function getIrlIntentionStatus(
  supabase: SupabaseClient,
  context: IrlMatchContext
): Promise<IrlIntentionStatus> {
  const { data: intentionRows } = await supabase
    .from('irl_intentions')
    .select('user_id,answers,submitted_at,revealed_at')
    .eq('match_id', context.matchId)
    .returns<IntentionRow[]>();

  const rows = (intentionRows ?? []).filter(row => context.participantUserIds.includes(row.user_id));
  const submittedUserIds = Array.from(new Set(rows.map(row => row.user_id)));
  const bothSubmitted = context.participantUserIds.every(userId => submittedUserIds.includes(userId));

  if (bothSubmitted && rows.some(row => !row.revealed_at)) {
    await supabase.rpc('irl_mark_intentions_revealed', { p_match_id: context.matchId });
  }

  const { data: refreshedRows } = await supabase
    .from('irl_intentions')
    .select('user_id,answers,submitted_at,revealed_at')
    .eq('match_id', context.matchId)
    .returns<IntentionRow[]>();

  const finalRows = (refreshedRows ?? rows).filter(row => context.participantUserIds.includes(row.user_id));
  const finalBothSubmitted = context.participantUserIds.every(userId =>
    finalRows.some(row => row.user_id === userId)
  );

  const answersByUser = finalBothSubmitted
    ? finalRows.reduce<Record<string, Record<string, unknown>>>((acc, row) => {
        acc[row.user_id] = row.answers ?? {};
        return acc;
      }, {})
    : null;

  const revealedAt = finalRows
    .map(row => row.revealed_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

  const bothSubmittedAt = finalBothSubmitted
    ? finalRows
        .map(row => row.submitted_at)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null
    : null;

  const reflectionDueAt = bothSubmittedAt
    ? new Date(new Date(bothSubmittedAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: myReflection } = await supabase
    .from('irl_reflections')
    .select('id,feeling,note,submitted_at')
    .eq('match_id', context.matchId)
    .eq('user_id', context.viewerUserId)
    .maybeSingle<ReflectionRow>();

  return {
    featureEnabled: true,
    matchId: context.matchId,
    submittedUserIds: Array.from(new Set(finalRows.map(row => row.user_id))),
    bothSubmitted: finalBothSubmitted,
    answersVisible: finalBothSubmitted,
    answersByUser,
    revealedAt,
    bothSubmittedAt,
    reflectionDueAt,
    myReflectionSubmitted: Boolean(myReflection),
    myReflection: myReflection ?? null,
  };
}

export function isReflectionDue(reflectionDueAt: string | null) {
  if (!reflectionDueAt) return false;
  const dueTs = new Date(reflectionDueAt).getTime();
  if (!Number.isFinite(dueTs)) return false;
  return Date.now() >= dueTs;
}
