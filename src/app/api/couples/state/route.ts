import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import {
  ensureCoupleTrack,
  getCycleKeyForModule,
  isCoupleModeEnabled,
  pairIsDisabled,
  pickDeterministicQuestion,
  resolveCoupleContext,
  type CoupleQuestionRow,
  type CoupleResponseRow,
} from '@/server/couples/service';

type TimelineEntry = {
  id: string;
  type: 'prompt' | 'checkin' | 'love_note';
  title: string;
  summary: string;
  createdAt: string;
};

type LoveNoteRow = {
  id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  email?: string | null;
};

type OnboardingRow = {
  user_id: string;
  category: string;
  response: unknown;
};

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
}

function firstString(values: Array<unknown>) {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function getName(userId: string, profiles: Map<string, ProfileRow>, byCategory: Map<string, Map<string, Record<string, unknown>>>) {
  const profile = profiles.get(userId) ?? null;
  const demographics = byCategory.get(userId)?.get('demographics') ?? {};
  const emailPrefix = typeof profile?.email === 'string' ? profile.email.split('@')[0] ?? '' : '';
  return (
    firstString([
      demographics.fullName,
      demographics.full_name,
      demographics.firstName,
      demographics.first_name,
      demographics.name,
      profile?.full_name,
      profile?.first_name,
      emailPrefix,
    ]) || 'Partner'
  );
}

function getPhoto(userId: string, byCategory: Map<string, Map<string, Record<string, unknown>>>) {
  const profileMeta = byCategory.get(userId)?.get('profile_meta') ?? {};
  const photos = Array.isArray(profileMeta.photos)
    ? profileMeta.photos.filter(photo => typeof photo === 'string')
    : [];
  return photos[0] ?? null;
}

function responsePreview(response: CoupleResponseRow) {
  if (response.response_text?.trim()) return response.response_text.trim();
  const value = response.response_value ?? {};
  if (typeof value.connectedScore === 'number') {
    const feltGood = typeof value.feltGood === 'string' ? value.feltGood.trim() : '';
    const wantMore = typeof value.wantMore === 'string' ? value.wantMore.trim() : '';
    const parts = [`Connected: ${value.connectedScore}/5`];
    if (feltGood) parts.push(`Felt good: ${feltGood}`);
    if (wantMore) parts.push(`Want more: ${wantMore}`);
    return parts.join(' · ');
  }
  if (typeof value.choice === 'string') return value.choice;
  if (typeof value.score === 'number') return `Score: ${value.score}`;
  return 'Shared a response';
}

function buildModuleState(
  args: {
    type: 'daily_micro_question' | 'weekly_pulse';
    question: CoupleQuestionRow;
    cycleKey: string;
    responses: CoupleResponseRow[];
    viewerUserId: string;
    partnerUserId: string;
  }
) {
  const cycleResponses = args.responses.filter(
    row => row.question_id === args.question.id && row.cycle_key === args.cycleKey
  );
  const mine = cycleResponses.find(row => row.user_id === args.viewerUserId) ?? null;
  const partner = cycleResponses.find(row => row.user_id === args.partnerUserId) ?? null;

  const status = !mine ? 'pending_self' : !partner ? 'waiting_partner' : 'complete';
  const visibleResponses = mine ? [mine, partner].filter(Boolean) as CoupleResponseRow[] : [];

  return {
    type: args.type,
    question: {
      id: args.question.id,
      text: args.question.question_text,
      category: args.question.category,
      metadata: args.question.metadata ?? {},
    },
    cycleKey: args.cycleKey,
    status,
    responses: visibleResponses.map(row => ({
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at,
      text: row.response_text ?? '',
      value: row.response_value ?? {},
      preview: responsePreview(row),
    })),
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isCoupleModeEnabled()) {
      return NextResponse.json({ enabled: false, hasCouple: false });
    }

    let context;
    try {
      context = await resolveCoupleContext(supabase, user.id);
    } catch (error) {
      if (looksLikeMissingTable(error as { code?: string; message?: string }, 'couples')) {
        return NextResponse.json({ enabled: true, hasCouple: false, unavailableReason: 'migration_required' });
      }
      throw error;
    }

    if (!context) {
      return NextResponse.json({ enabled: true, hasCouple: false });
    }

    if (await pairIsDisabled(supabase, user.id, context.partnerUserId)) {
      return NextResponse.json({ enabled: true, hasCouple: false, unavailableReason: 'pair_unavailable' });
    }

    const track = await ensureCoupleTrack(supabase, context);
    if (!track) {
      return NextResponse.json({ error: 'Unable to initialize couple track' }, { status: 500 });
    }

    const [dailyKey, weeklyKey] = [getCycleKeyForModule('daily'), getCycleKeyForModule('weekly')];

    const [{ data: questions, error: questionsError }, { data: moduleResponses, error: responsesError }, { data: timelineResponses }] = await Promise.all([
      supabase
        .from('connection_track_questions')
        .select('id,type,question_text,category,metadata')
        .eq('is_active', true)
        .in('type', ['daily_micro_question', 'weekly_pulse'])
        .returns<CoupleQuestionRow[]>(),
      supabase
        .from('connection_track_responses')
        .select('id,question_id,user_id,cycle_key,response_text,response_value,created_at')
        .eq('connection_track_id', track.id)
        .in('cycle_key', [dailyKey, weeklyKey])
        .returns<CoupleResponseRow[]>(),
      supabase
        .from('connection_track_responses')
        .select('id,question_id,user_id,cycle_key,response_text,response_value,created_at')
        .eq('connection_track_id', track.id)
        .order('created_at', { ascending: false })
        .limit(120)
        .returns<CoupleResponseRow[]>(),
    ]);

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json({ error: questionsError?.message ?? 'Question pool unavailable' }, { status: 500 });
    }

    if (responsesError) {
      return NextResponse.json({ error: responsesError.message }, { status: 500 });
    }

    const dailyPool = questions.filter(question => question.type === 'daily_micro_question');
    const weeklyPool = questions.filter(question => question.type === 'weekly_pulse');
    if (dailyPool.length === 0 || weeklyPool.length === 0) {
      return NextResponse.json({ error: 'Daily/weekly couple prompts are not configured.' }, { status: 500 });
    }

    const dailyQuestion = pickDeterministicQuestion(track.id, dailyKey, dailyPool, 'couple-daily');
    const weeklyQuestion = pickDeterministicQuestion(track.id, weeklyKey, weeklyPool, 'couple-weekly');
    if (!dailyQuestion || !weeklyQuestion) {
      return NextResponse.json({ error: 'Unable to select couple prompts.' }, { status: 500 });
    }

    const responses = moduleResponses ?? [];
    const daily = buildModuleState({
      type: 'daily_micro_question',
      question: dailyQuestion,
      cycleKey: dailyKey,
      responses,
      viewerUserId: context.viewerUserId,
      partnerUserId: context.partnerUserId,
    });
    const weekly = buildModuleState({
      type: 'weekly_pulse',
      question: weeklyQuestion,
      cycleKey: weeklyKey,
      responses,
      viewerUserId: context.viewerUserId,
      partnerUserId: context.partnerUserId,
    });

    const [{ data: profileRows }, { data: onboardingRows }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,full_name,first_name,email')
        .in('id', [context.viewerUserId, context.partnerUserId])
        .returns<ProfileRow[]>(),
      supabase
        .from('onboarding_responses')
        .select('user_id,category,response')
        .in('user_id', [context.viewerUserId, context.partnerUserId])
        .in('category', ['demographics', 'profile_meta'])
        .returns<OnboardingRow[]>(),
    ]);

    const profiles = new Map((profileRows ?? []).map(row => [row.id, row]));
    const byCategory = new Map<string, Map<string, Record<string, unknown>>>();
    for (const row of onboardingRows ?? []) {
      if (!row || typeof row.response !== 'object' || row.response === null) continue;
      const userMap = byCategory.get(row.user_id) ?? new Map<string, Record<string, unknown>>();
      userMap.set(row.category, row.response as Record<string, unknown>);
      byCategory.set(row.user_id, userMap);
    }

    const viewerName = getName(context.viewerUserId, profiles, byCategory);
    const partnerName = getName(context.partnerUserId, profiles, byCategory);
    const partnerPhotoUrl = getPhoto(context.partnerUserId, byCategory);

    let loveNotes: LoveNoteRow[] = [];
    const { data: noteRows, error: notesError } = await supabase
      .from('couple_love_notes')
      .select('id,sender_user_id,body,created_at')
      .eq('couple_id', context.couple.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .returns<LoveNoteRow[]>();

    if (notesError && !looksLikeMissingTable(notesError, 'couple_love_notes')) {
      return NextResponse.json({ error: notesError.message }, { status: 500 });
    }
    loveNotes = noteRows ?? [];

    const questionById = new Map(questions.map(question => [question.id, question]));
    const grouped = new Map<string, CoupleResponseRow[]>();
    for (const row of timelineResponses ?? []) {
      const key = `${row.question_id}:${row.cycle_key}`;
      const bucket = grouped.get(key) ?? [];
      bucket.push(row);
      grouped.set(key, bucket);
    }

    const promptEntries: TimelineEntry[] = [];
    for (const [key, group] of grouped) {
      const [questionId] = key.split(':');
      const question = questionById.get(questionId);
      if (!question) continue;
      if (!['daily_micro_question', 'weekly_pulse'].includes(question.type)) continue;

      const byUser = new Map(group.map(row => [row.user_id, row]));
      const mine = byUser.get(context.viewerUserId);
      const partner = byUser.get(context.partnerUserId);
      if (!mine || !partner) continue;

      const latestAt =
        new Date(Math.max(new Date(mine.created_at).getTime(), new Date(partner.created_at).getTime())).toISOString();
      const title = question.type === 'daily_micro_question' ? 'Today’s Prompt' : 'Weekly Check-In';
      const summary = `${viewerName}: ${responsePreview(mine)} · ${partnerName}: ${responsePreview(partner)}`;

      promptEntries.push({
        id: `prompt:${key}`,
        type: question.type === 'daily_micro_question' ? 'prompt' : 'checkin',
        title,
        summary,
        createdAt: latestAt,
      });
    }

    const noteEntries: TimelineEntry[] = loveNotes.map(note => ({
      id: `note:${note.id}`,
      type: 'love_note',
      title: 'Love Note',
      summary: `${note.sender_user_id === context.viewerUserId ? 'You' : partnerName}: ${note.body}`,
      createdAt: note.created_at,
    }));

    const timeline = [...promptEntries, ...noteEntries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 40);

    return NextResponse.json({
      enabled: true,
      hasCouple: true,
      viewerUserId: context.viewerUserId,
      couple: {
        id: context.couple.id,
        partnerUserId: context.partnerUserId,
        partnerName,
        partnerPhotoUrl,
        confirmedAt: context.couple.confirmed_at ?? context.couple.created_at,
      },
      modules: {
        daily,
        weekly,
      },
      loveNotes: loveNotes.map(note => ({
        id: note.id,
        body: note.body,
        createdAt: note.created_at,
        senderUserId: note.sender_user_id,
        isMine: note.sender_user_id === context.viewerUserId,
      })),
      timeline,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
