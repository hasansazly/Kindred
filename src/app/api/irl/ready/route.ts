import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { isIRLFeatureEnabled } from '@/lib/irl/featureFlag';
import { getIrlReadinessStatus, resolveIrlMatchContext } from '@/lib/irl/service';

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

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
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

    const { error: insertError } = await supabase.from('irl_readiness').upsert(
      {
        match_id: matchId,
        user_id: user.id,
        ready_at: new Date().toISOString(),
      },
      {
        onConflict: 'match_id,user_id',
      }
    );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const updated = await getIrlReadinessStatus(supabase, context, { featureEnabled: true });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
