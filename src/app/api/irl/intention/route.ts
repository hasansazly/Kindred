import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { isIRLFeatureEnabled } from '@/lib/irl/featureFlag';
import { getIrlIntentionStatus, getIrlReadinessStatus, resolveIrlMatchContext } from '@/lib/irl/service';

type IntentionAnswers = {
  hopingFor: string;
  nerves: string;
  curiousAbout: string;
};

function sanitizeAnswers(value: unknown): IntentionAnswers | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const hopingFor = typeof raw.hopingFor === 'string' ? raw.hopingFor.trim() : '';
  const nerves = typeof raw.nerves === 'string' ? raw.nerves.trim() : '';
  const curiousAbout = typeof raw.curiousAbout === 'string' ? raw.curiousAbout.trim() : '';

  if (!hopingFor || !nerves || !curiousAbout) return null;

  return {
    hopingFor: hopingFor.slice(0, 600),
    nerves: nerves.slice(0, 600),
    curiousAbout: curiousAbout.slice(0, 600),
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!isIRLFeatureEnabled()) {
      return NextResponse.json({ error: 'IRL feature is disabled.' }, { status: 403 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const matchId = typeof payload?.matchId === 'string' ? payload.matchId.trim() : '';
    const answers = sanitizeAnswers(payload?.answers);

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    if (!answers) {
      return NextResponse.json(
        { error: 'answers.hopingFor, answers.nerves, and answers.curiousAbout are required' },
        { status: 400 }
      );
    }

    const context = await resolveIrlMatchContext(supabase, user.id, matchId);
    if (!context) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const readiness = await getIrlReadinessStatus(supabase, context, { featureEnabled: true });
    if (!readiness.unlocked) {
      return NextResponse.json(
        { error: 'IRL Date Track unlocks after 3+ consecutive Connection Track days.' },
        { status: 403 }
      );
    }

    if (!readiness.bothReady) {
      return NextResponse.json({ error: 'Both users must tap ready first.' }, { status: 403 });
    }

    const { error: upsertError } = await supabase.from('irl_intentions').upsert(
      {
        match_id: matchId,
        user_id: user.id,
        answers,
        submitted_at: new Date().toISOString(),
      },
      {
        onConflict: 'match_id,user_id',
      }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const intention = await getIrlIntentionStatus(supabase, context);
    return NextResponse.json({ ...intention, bothReady: readiness.bothReady, unlocked: readiness.unlocked });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
