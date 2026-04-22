import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { isIRLFeatureEnabled } from '@/lib/irl/featureFlag';
import { getIrlIntentionStatus, getIrlReadinessStatus, isReflectionDue, resolveIrlMatchContext } from '@/lib/irl/service';

const VALID_FEELINGS = new Set(['Spark', 'Friendly', 'Not quite']);

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
    const feeling = typeof payload?.feeling === 'string' ? payload.feeling.trim() : '';
    const note = typeof payload?.note === 'string' ? payload.note.trim() : '';

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    if (!VALID_FEELINGS.has(feeling)) {
      return NextResponse.json({ error: 'feeling must be Spark, Friendly, or Not quite' }, { status: 400 });
    }

    const context = await resolveIrlMatchContext(supabase, user.id, matchId);
    if (!context) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const readiness = await getIrlReadinessStatus(supabase, context, { featureEnabled: true });
    if (!readiness.unlocked || !readiness.bothReady) {
      return NextResponse.json({ error: 'Reflection is unavailable until both users are ready.' }, { status: 403 });
    }

    const intention = await getIrlIntentionStatus(supabase, context);
    if (!intention.bothSubmitted) {
      return NextResponse.json({ error: 'Reflection unlocks after both intention checks are submitted.' }, { status: 403 });
    }

    if (!isReflectionDue(intention.reflectionDueAt)) {
      return NextResponse.json({ error: 'Reflection becomes available 24 hours after intention check completion.' }, { status: 403 });
    }

    const { error: upsertError } = await supabase.from('irl_reflections').upsert(
      {
        match_id: matchId,
        user_id: user.id,
        feeling,
        note: note ? note.slice(0, 1500) : null,
        submitted_at: new Date().toISOString(),
      },
      {
        onConflict: 'match_id,user_id',
      }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
