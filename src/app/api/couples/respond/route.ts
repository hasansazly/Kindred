import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import {
  ensureCoupleTrack,
  getCycleKeyForModule,
  isCoupleModeEnabled,
  pairIsDisabled,
  pickDeterministicQuestion,
  resolveCoupleContext,
  type CoupleQuestionRow,
} from '@/server/couples/service';

type SubmitPayload = {
  module?: 'daily' | 'weekly';
  responseText?: string;
  responseValue?: Record<string, unknown>;
};

type ModuleType = 'daily_micro_question' | 'weekly_pulse';

function typeForModule(module: 'daily' | 'weekly'): ModuleType {
  return module === 'daily' ? 'daily_micro_question' : 'weekly_pulse';
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isCoupleModeEnabled()) {
      return NextResponse.json({ error: 'Couple mode is disabled' }, { status: 403 });
    }

    const payload = (await req.json().catch(() => ({}))) as SubmitPayload;
    const moduleKey = payload.module;
    const responseText = typeof payload.responseText === 'string' ? payload.responseText.trim() : '';
    const responseValue =
      payload.responseValue && typeof payload.responseValue === 'object' ? payload.responseValue : null;

    if (moduleKey !== 'daily' && moduleKey !== 'weekly') {
      return NextResponse.json({ error: 'module must be daily or weekly' }, { status: 400 });
    }

    if (!responseText && !responseValue) {
      return NextResponse.json({ error: 'Provide responseText or responseValue' }, { status: 400 });
    }

    const context = await resolveCoupleContext(supabase, user.id);
    if (!context) {
      return NextResponse.json({ error: 'Couple mode unavailable' }, { status: 403 });
    }

    if (await pairIsDisabled(supabase, user.id, context.partnerUserId)) {
      return NextResponse.json({ error: 'Couple mode unavailable for this pair' }, { status: 403 });
    }

    const track = await ensureCoupleTrack(supabase, context);
    if (!track) {
      return NextResponse.json({ error: 'Unable to initialize couple track' }, { status: 500 });
    }

    const moduleType = typeForModule(moduleKey);
    const cycleKey = getCycleKeyForModule(moduleKey);

    const { data: questions, error: questionError } = await supabase
      .from('connection_track_questions')
      .select('id,type,question_text,category,metadata')
      .eq('is_active', true)
      .eq('type', moduleType)
      .returns<CoupleQuestionRow[]>();

    if (questionError || !questions || questions.length === 0) {
      return NextResponse.json({ error: questionError?.message ?? 'Prompt pool unavailable' }, { status: 500 });
    }

    const question = pickDeterministicQuestion(
      track.id,
      cycleKey,
      questions,
      moduleKey === 'daily' ? 'couple-daily' : 'couple-weekly'
    );

    if (!question) {
      return NextResponse.json({ error: 'Unable to select prompt' }, { status: 500 });
    }

    const { error: upsertError } = await supabase
      .from('connection_track_responses')
      .upsert(
        {
          connection_track_id: track.id,
          question_id: question.id,
          user_id: user.id,
          cycle_key: cycleKey,
          response_text: responseText || null,
          response_value: responseValue,
        },
        { onConflict: 'connection_track_id,question_id,user_id,cycle_key' }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    await supabase.from('connection_track_events').insert({
      connection_track_id: track.id,
      event_type: 'couple_module_response_submitted',
      metadata: {
        module: moduleKey,
        cycle_key: cycleKey,
        question_id: question.id,
        user_id: user.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
