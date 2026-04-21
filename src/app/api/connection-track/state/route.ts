import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import {
  ensureConnectionTrackForPair,
  getTodayKey,
  getWeekKey,
  stableHash,
} from '@/server/connectionTrack/service';

type MatchRow = {
  id: string;
  user_id: string;
  matched_user_id: string;
  status: string;
  created_at?: string;
};

type QuestionRow = {
  id: string;
  type: 'daily_micro_question' | 'weekly_pulse' | 'pre_date_check';
  question_text: string;
  category: string;
  metadata?: Record<string, unknown> | null;
};

type ResponseRow = {
  id: string;
  connection_track_id: string;
  question_id: string;
  user_id: string;
  cycle_key: string;
  response_text?: string | null;
  response_value?: Record<string, unknown> | null;
  created_at: string;
};

type EventRow = {
  id: string;
  event_type: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

const DAILY_REPEAT_LOOKBACK_DAYS = 75;
const WEEKLY_REPEAT_LOOKBACK_DAYS = 75;

function pickDeterministicQuestion(trackId: string, cycleKey: string, bucket: QuestionRow[], salt: string) {
  if (bucket.length === 0) return null;
  const index = stableHash(`${trackId}:${cycleKey}:${salt}`) % bucket.length;
  return bucket[index] ?? null;
}

function pickRotatingQuestion(
  trackId: string,
  cycleKey: string,
  bucket: QuestionRow[],
  salt: string,
  history: Array<Pick<ResponseRow, 'question_id' | 'created_at'>>,
  opts?: { lookbackDays?: number; avoidRepeatCategory?: boolean }
) {
  if (bucket.length === 0) return null;

  const lookbackDays = opts?.lookbackDays ?? 30;
  const avoidRepeatCategory = opts?.avoidRepeatCategory ?? true;
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  const questionById = new Map(bucket.map(question => [question.id, question]));
  const recentQuestionIds = new Set(
    history
      .filter(item => {
        const ts = new Date(item.created_at).getTime();
        return Number.isFinite(ts) && ts >= cutoff;
      })
      .map(item => item.question_id)
  );

  let pool = bucket.filter(question => !recentQuestionIds.has(question.id));
  if (pool.length === 0) pool = [...bucket];

  if (avoidRepeatCategory && pool.length > 1) {
    const latest = history
      .filter(item => questionById.has(item.question_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const latestCategory = latest ? questionById.get(latest.question_id)?.category ?? null : null;
    if (latestCategory) {
      const categoryRotated = pool.filter(question => question.category !== latestCategory);
      if (categoryRotated.length > 0) {
        pool = categoryRotated;
      }
    }
  }

  return pickDeterministicQuestion(trackId, cycleKey, pool, salt);
}

function pickLockedOrRotatingQuestion(args: {
  trackId: string;
  cycleKey: string;
  bucket: QuestionRow[];
  salt: string;
  history: Array<Pick<ResponseRow, 'question_id' | 'created_at'>>;
  cycleResponses: Array<Pick<ResponseRow, 'cycle_key' | 'question_id' | 'created_at'>>;
  lookbackDays: number;
}) {
  const existingForCycle = args.cycleResponses
    .filter(response => response.cycle_key === args.cycleKey)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

  if (existingForCycle) {
    const locked = args.bucket.find(question => question.id === existingForCycle.question_id);
    if (locked) return locked;
  }

  return pickRotatingQuestion(args.trackId, args.cycleKey, args.bucket, args.salt, args.history, {
    lookbackDays: args.lookbackDays,
    avoidRepeatCategory: true,
  });
}

function normalizeResponses(responses: ResponseRow[]) {
  return responses.map(response => ({
    id: response.id,
    userId: response.user_id,
    text: response.response_text ?? '',
    value: response.response_value ?? null,
    createdAt: response.created_at,
  }));
}

function buildModuleState(args: {
  question: QuestionRow;
  cycleKey: string;
  responses: ResponseRow[];
  currentUserId: string;
  otherUserId: string;
}) {
  const moduleResponses = args.responses.filter(
    response => response.question_id === args.question.id && response.cycle_key === args.cycleKey
  );
  const myResponse = moduleResponses.find(response => response.user_id === args.currentUserId) ?? null;
  const otherResponse = moduleResponses.find(response => response.user_id === args.otherUserId) ?? null;

  const status = !myResponse
    ? 'pending_self'
    : !otherResponse
      ? 'waiting_other'
      : 'complete';

  return {
    question: {
      id: args.question.id,
      text: args.question.question_text,
      category: args.question.category,
      metadata: args.question.metadata ?? {},
    },
    cycleKey: args.cycleKey,
    status,
    responses: normalizeResponses(moduleResponses),
  };
}

async function pairIsDisabled(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  currentUserId: string,
  otherUserId: string
) {
  const [{ data: blockRows }, { data: unmatchRows }] = await Promise.all([
    supabase
      .from('blocks')
      .select('id')
      .or(
        `and(blocker_user_id.eq.${currentUserId},blocked_user_id.eq.${otherUserId}),and(blocker_user_id.eq.${otherUserId},blocked_user_id.eq.${currentUserId})`
      ),
    supabase
      .from('unmatches')
      .select('id')
      .or(
        `and(initiated_by_user_id.eq.${currentUserId},unmatched_user_id.eq.${otherUserId}),and(initiated_by_user_id.eq.${otherUserId},unmatched_user_id.eq.${currentUserId})`
      ),
  ]);

  return (blockRows ?? []).length > 0 || (unmatchRows ?? []).length > 0;
}

async function resolveContext(
  req: NextRequest,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  currentUserId: string
): Promise<{ match: MatchRow; otherUserId: string; conversationId: string | null } | null> {
  const conversationId = req.nextUrl.searchParams.get('conversationId')?.trim() ?? '';
  const matchId = req.nextUrl.searchParams.get('matchId')?.trim() ?? '';

  if (!conversationId && !matchId) return null;

  if (conversationId) {
    const { data: participantRows, error: participantError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    if (participantError) throw participantError;

    const userIds = (participantRows ?? []).map(row => row.user_id);
    if (!userIds.includes(currentUserId)) {
      throw new Error('Unauthorized conversation access');
    }

    const otherUserId = userIds.find(id => id !== currentUserId);
    if (!otherUserId) throw new Error('Direct conversation participant not found');

    const { data: matchRows, error: matchError } = await supabase
      .from('matches')
      .select('id,user_id,matched_user_id,status,created_at')
      .eq('status', 'active')
      .or(
        `and(user_id.eq.${currentUserId},matched_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},matched_user_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: false })
      .limit(1)
      .returns<MatchRow[]>();

    if (matchError) {
      throw matchError;
    }

    const match = matchRows?.[0] ?? null;
    if (!match) {
      throw new Error('No active match found');
    }

    return { match, otherUserId, conversationId };
  }

  const { data: match } = await supabase
    .from('matches')
    .select('id,user_id,matched_user_id,status')
    .eq('id', matchId)
    .eq('user_id', currentUserId)
    .eq('status', 'active')
    .maybeSingle<MatchRow>();

  if (!match) {
    throw new Error('No active match found');
  }

  return {
    match,
    otherUserId: match.matched_user_id,
    conversationId: null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = await resolveContext(req, supabase, user.id);
    if (!context) {
      return NextResponse.json({ error: 'conversationId or matchId is required' }, { status: 400 });
    }

    if (await pairIsDisabled(supabase, user.id, context.otherUserId)) {
      return NextResponse.json({ error: 'Connection track unavailable for this pair.' }, { status: 403 });
    }

    const track = await ensureConnectionTrackForPair(supabase, {
      userA: user.id,
      userB: context.otherUserId,
      matchId: context.match.id,
      conversationId: context.conversationId,
    });

    if (!track) {
      return NextResponse.json({ error: 'Unable to initialize connection track' }, { status: 500 });
    }

    const { data: questions, error: questionsError } = await supabase
      .from('connection_track_questions')
      .select('id,type,question_text,category,metadata')
      .eq('is_active', true)
      .returns<QuestionRow[]>();

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    const dailyPool = (questions ?? []).filter(question => question.type === 'daily_micro_question');
    const weeklyPool = (questions ?? []).filter(question => question.type === 'weekly_pulse');
    const preDatePool = (questions ?? []).filter(question => question.type === 'pre_date_check');

    if (!dailyPool.length || !weeklyPool.length || !preDatePool.length) {
      return NextResponse.json({ error: 'Connection track question pool is incomplete.' }, { status: 500 });
    }

    const todayKey = getTodayKey();
    const weekKey = getWeekKey();

    const { data: cycleResponseAnchors } = await supabase
      .from('connection_track_responses')
      .select('cycle_key,question_id,created_at')
      .eq('connection_track_id', track.id)
      .in('cycle_key', [todayKey, weekKey])
      .returns<Array<Pick<ResponseRow, 'cycle_key' | 'question_id' | 'created_at'>>>();

    const { data: historyRows } = await supabase
      .from('connection_track_responses')
      .select('question_id,created_at')
      .eq('connection_track_id', track.id)
      .order('created_at', { ascending: false })
      .limit(240)
      .returns<Array<Pick<ResponseRow, 'question_id' | 'created_at'>>>();

    const history = historyRows ?? [];
    const anchors = cycleResponseAnchors ?? [];
    const dailyQuestion = pickLockedOrRotatingQuestion({
      trackId: track.id,
      cycleKey: todayKey,
      bucket: dailyPool,
      salt: 'daily',
      history,
      cycleResponses: anchors,
      lookbackDays: DAILY_REPEAT_LOOKBACK_DAYS,
    });
    const weeklyQuestion = pickLockedOrRotatingQuestion({
      trackId: track.id,
      cycleKey: weekKey,
      bucket: weeklyPool,
      salt: 'weekly',
      history,
      cycleResponses: anchors,
      lookbackDays: WEEKLY_REPEAT_LOOKBACK_DAYS,
    });

    if (!dailyQuestion || !weeklyQuestion) {
      return NextResponse.json({ error: 'Unable to select active questions.' }, { status: 500 });
    }

    const { data: eventRows, error: eventError } = await supabase
      .from('connection_track_events')
      .select('id,event_type,metadata,created_at')
      .eq('connection_track_id', track.id)
      .in('event_type', ['pre_date_started', 'pre_date_completed'])
      .order('created_at', { ascending: false })
      .returns<EventRow[]>();

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    const completedCycleKeys = new Set(
      (eventRows ?? [])
        .filter(event => event.event_type === 'pre_date_completed')
        .map(event => String(event.metadata?.cycle_key ?? '').trim())
        .filter(Boolean)
    );

    const activePreDateEvent = (eventRows ?? []).find(event => {
      if (event.event_type !== 'pre_date_started') return false;
      const cycleKey = String(event.metadata?.cycle_key ?? '').trim();
      if (!cycleKey) return false;
      return !completedCycleKeys.has(cycleKey);
    });

    const preDateCycleKey = activePreDateEvent ? String(activePreDateEvent.metadata?.cycle_key ?? '') : null;
    const preDateQuestionId = activePreDateEvent ? String(activePreDateEvent.metadata?.question_id ?? '') : null;
    const preDateQuestion = preDateQuestionId
      ? preDatePool.find(question => question.id === preDateQuestionId) ?? null
      : null;

    const requestedCycles = [todayKey, weekKey, preDateCycleKey].filter(Boolean) as string[];

    const { data: responseRows, error: responseError } = await supabase
      .from('connection_track_responses')
      .select('id,connection_track_id,question_id,user_id,cycle_key,response_text,response_value,created_at')
      .eq('connection_track_id', track.id)
      .in('cycle_key', requestedCycles.length > 0 ? requestedCycles : ['__none__'])
      .returns<ResponseRow[]>();

    if (responseError) {
      return NextResponse.json({ error: responseError.message }, { status: 500 });
    }

    const responses = responseRows ?? [];

    const daily = buildModuleState({
      question: dailyQuestion,
      cycleKey: todayKey,
      responses,
      currentUserId: user.id,
      otherUserId: context.otherUserId,
    });

    const weekly = buildModuleState({
      question: weeklyQuestion,
      cycleKey: weekKey,
      responses,
      currentUserId: user.id,
      otherUserId: context.otherUserId,
    });

    const preDate = preDateQuestion && preDateCycleKey
      ? buildModuleState({
          question: preDateQuestion,
          cycleKey: preDateCycleKey,
          responses,
          currentUserId: user.id,
          otherUserId: context.otherUserId,
        })
      : {
          question: null,
          cycleKey: null,
          status: 'not_started',
          responses: [],
        };

    const weeklySummary =
      weekly.status === 'complete'
        ? 'You both checked in this week. Keep the pace transparent and low-pressure.'
        : 'Once both of you respond, your shared weekly pulse summary appears here.';

    return NextResponse.json({
      viewerUserId: user.id,
      track: {
        id: track.id,
        status: track.status,
        matchId: track.match_id ?? context.match.id,
        conversationId: track.conversation_id ?? context.conversationId,
      },
      modules: {
        daily,
        weekly: {
          ...weekly,
          summary: weeklySummary,
        },
        preDate,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
