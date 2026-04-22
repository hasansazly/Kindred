import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import {
  ensureCoupleTrack,
  getCycleKeyForModule,
  isCoupleModeEnabled,
  pairIsDisabled,
  pickRotatingQuestion,
  resolveCoupleContext,
  type CoupleQuestionRow,
  type CoupleResponseRow,
} from '@/server/couples/service';
import { getCoupleModeState } from '@/server/couples/mode';

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

type DatePlanRow = {
  id: string;
  title: string;
  summary: string;
  plan_steps: string[] | null;
  created_at: string;
};

type ReminderRow = {
  id: string;
  title: string;
  note: string;
  due_at: string;
  completed: boolean;
  completed_at: string | null;
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

    const mode = await getCoupleModeState(supabase, user.id);

    if (!isCoupleModeEnabled()) {
      return NextResponse.json({
        enabled: false,
        hasCouple: false,
        mode: {
          selfEnabled: mode.selfEnabled,
          partnerEnabled: mode.partnerEnabled,
          effectiveOn: mode.effectiveOn,
          migrationRequired: mode.migrationRequired,
        },
      });
    }

    let context;
    try {
      context = await resolveCoupleContext(supabase, user.id);
    } catch (error) {
      if (looksLikeMissingTable(error as { code?: string; message?: string }, 'couples')) {
        return NextResponse.json({
          enabled: true,
          hasCouple: false,
          unavailableReason: 'migration_required',
          mode: {
            selfEnabled: mode.selfEnabled,
            partnerEnabled: mode.partnerEnabled,
            effectiveOn: mode.effectiveOn,
            migrationRequired: mode.migrationRequired,
          },
        });
      }
      throw error;
    }

    if (!context) {
      return NextResponse.json({
        enabled: true,
        hasCouple: false,
        mode: {
          selfEnabled: mode.selfEnabled,
          partnerEnabled: mode.partnerEnabled,
          effectiveOn: mode.effectiveOn,
          migrationRequired: mode.migrationRequired,
        },
      });
    }

    if (await pairIsDisabled(supabase, user.id, context.partnerUserId)) {
      return NextResponse.json({
        enabled: true,
        hasCouple: false,
        unavailableReason: 'pair_unavailable',
        mode: {
          selfEnabled: mode.selfEnabled,
          partnerEnabled: mode.partnerEnabled,
          effectiveOn: mode.effectiveOn,
          migrationRequired: mode.migrationRequired,
        },
      });
    }

    const track = await ensureCoupleTrack(supabase, context);
    if (!track) {
      return NextResponse.json({ error: 'Unable to initialize couple track' }, { status: 500 });
    }

    const [dailyKey, weeklyKey] = [getCycleKeyForModule('daily'), getCycleKeyForModule('weekly')];
    const oneDayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

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

    const history = timelineResponses ?? [];
    const dailyQuestion = pickRotatingQuestion(
      track.id,
      dailyKey,
      dailyPool,
      'couple-daily',
      history,
      { lookbackDays: 30, avoidRepeatCategory: true }
    );
    const weeklyQuestion = pickRotatingQuestion(
      track.id,
      weeklyKey,
      weeklyPool,
      'couple-weekly',
      history,
      { lookbackDays: 60, avoidRepeatCategory: true }
    );
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
    let datePlans: DatePlanRow[] = [];
    let reminders: ReminderRow[] = [];

    const [
      { data: noteRows, error: notesError },
      { data: datePlanRows, error: datePlansError },
      { data: reminderRows, error: remindersError },
    ] = await Promise.all([
      supabase
        .from('couple_love_notes')
        .select('id,sender_user_id,body,created_at')
        .eq('couple_id', context.couple.id)
        .gte('created_at', oneDayAgoIso)
        .order('created_at', { ascending: false })
        .limit(30)
        .returns<LoveNoteRow[]>(),
      supabase
        .from('couple_date_plans')
        .select('id,title,summary,plan_steps,created_at')
        .eq('couple_id', context.couple.id)
        .eq('created_by_user_id', context.viewerUserId)
        .gte('created_at', oneDayAgoIso)
        .order('created_at', { ascending: false })
        .limit(10)
        .returns<DatePlanRow[]>(),
      supabase
        .from('couple_reminders')
        .select('id,title,note,due_at,completed,completed_at,created_at')
        .eq('couple_id', context.couple.id)
        .order('due_at', { ascending: true })
        .limit(30)
        .returns<ReminderRow[]>(),
    ]);

    if (notesError && !looksLikeMissingTable(notesError, 'couple_love_notes')) {
      return NextResponse.json({ error: notesError.message }, { status: 500 });
    }
    if (datePlansError && !looksLikeMissingTable(datePlansError, 'couple_date_plans')) {
      return NextResponse.json({ error: datePlansError.message }, { status: 500 });
    }
    if (remindersError && !looksLikeMissingTable(remindersError, 'couple_reminders')) {
      return NextResponse.json({ error: remindersError.message }, { status: 500 });
    }

    loveNotes = noteRows ?? [];
    datePlans = datePlanRows ?? [];
    reminders = reminderRows ?? [];

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

    const openReminders = reminders.filter(item => !item.completed);
    const nowTs = Date.now();
    const nextReminder =
      openReminders.find(item => new Date(item.due_at).getTime() >= nowTs) ?? openReminders[0] ?? null;
    const completedCheckins = timeline.filter(item => item.type === 'checkin').length;
    const memoryCount = timeline.length;
    const recentDatePlan = datePlans[0] ?? null;

    return NextResponse.json({
      enabled: true,
      hasCouple: true,
      mode: {
        selfEnabled: mode.selfEnabled,
        partnerEnabled: mode.partnerEnabled,
        effectiveOn: mode.effectiveOn,
        migrationRequired: mode.migrationRequired,
      },
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
      datePlans: datePlans.map(plan => ({
        id: plan.id,
        title: plan.title,
        summary: plan.summary,
        steps: Array.isArray(plan.plan_steps) ? plan.plan_steps : [],
        createdAt: plan.created_at,
      })),
      reminders: reminders.map(reminder => ({
        id: reminder.id,
        title: reminder.title,
        note: reminder.note,
        dueAt: reminder.due_at,
        completed: reminder.completed,
        completedAt: reminder.completed_at,
        createdAt: reminder.created_at,
      })),
      dashboard: {
        openReminderCount: openReminders.length,
        nextReminder: nextReminder
          ? {
              id: nextReminder.id,
              title: nextReminder.title,
              dueAt: nextReminder.due_at,
            }
          : null,
        memoryCount,
        completedCheckins,
        lastDatePlanTitle: recentDatePlan?.title ?? null,
      },
      timeline,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
