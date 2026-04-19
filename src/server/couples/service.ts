import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureConnectionTrackForPair, getTodayKey, getWeekKey, stableHash } from '@/server/connectionTrack/service';

export type CoupleRow = {
  id: string;
  user_one_id: string;
  user_two_id: string;
  status: 'confirmed' | 'inactive';
  match_id: string | null;
  conversation_id: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export type CoupleContext = {
  couple: CoupleRow;
  partnerUserId: string;
  viewerUserId: string;
};

export type CoupleQuestionRow = {
  id: string;
  type: 'daily_micro_question' | 'weekly_pulse';
  question_text: string;
  category: string;
  metadata?: Record<string, unknown> | null;
};

export type CoupleResponseRow = {
  id: string;
  question_id: string;
  user_id: string;
  cycle_key: string;
  response_text: string | null;
  response_value: Record<string, unknown> | null;
  created_at: string;
};

export function isCoupleModeEnabled() {
  return process.env.COUPLE_MODE_ENABLED !== 'false';
}

export function sortPair(userA: string, userB: string): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}

export function pairKey(userA: string, userB: string) {
  const [a, b] = sortPair(userA, userB);
  return `${a}:${b}`;
}

export function pickDeterministicQuestion(
  trackId: string,
  cycleKey: string,
  questions: CoupleQuestionRow[],
  salt: string
) {
  if (questions.length === 0) return null;
  const index = stableHash(`${trackId}:${cycleKey}:${salt}`) % questions.length;
  return questions[index] ?? null;
}

export async function findConfirmedCoupleForUser(supabase: SupabaseClient, userId: string): Promise<CoupleRow | null> {
  const { data, error } = await supabase
    .from('couples')
    .select('id,user_one_id,user_two_id,status,match_id,conversation_id,confirmed_at,created_at')
    .eq('status', 'confirmed')
    .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
    .order('confirmed_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .returns<CoupleRow[]>();

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

export async function resolveCoupleContext(supabase: SupabaseClient, userId: string): Promise<CoupleContext | null> {
  const couple = await findConfirmedCoupleForUser(supabase, userId);
  if (!couple) return null;

  const partnerUserId = couple.user_one_id === userId ? couple.user_two_id : couple.user_one_id;
  return {
    couple,
    partnerUserId,
    viewerUserId: userId,
  };
}

export async function pairIsDisabled(supabase: SupabaseClient, viewerUserId: string, partnerUserId: string) {
  const [{ data: blocks }, { data: unmatches }] = await Promise.all([
    supabase
      .from('blocks')
      .select('id')
      .or(
        `and(blocker_user_id.eq.${viewerUserId},blocked_user_id.eq.${partnerUserId}),and(blocker_user_id.eq.${partnerUserId},blocked_user_id.eq.${viewerUserId})`
      ),
    supabase
      .from('unmatches')
      .select('id')
      .or(
        `and(initiated_by_user_id.eq.${viewerUserId},unmatched_user_id.eq.${partnerUserId}),and(initiated_by_user_id.eq.${partnerUserId},unmatched_user_id.eq.${viewerUserId})`
      ),
  ]);

  return (blocks ?? []).length > 0 || (unmatches ?? []).length > 0;
}

export function getCycleKeyForModule(module: 'daily' | 'weekly') {
  return module === 'daily' ? getTodayKey() : getWeekKey();
}

export async function ensureCoupleTrack(supabase: SupabaseClient, context: CoupleContext) {
  return ensureConnectionTrackForPair(supabase, {
    userA: context.viewerUserId,
    userB: context.partnerUserId,
    matchId: context.couple.match_id,
    conversationId: context.couple.conversation_id,
  });
}
