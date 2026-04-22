import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../../utils/supabase/server';
import { isIRLFeatureEnabled } from '@/lib/irl/featureFlag';
import { getIrlReadinessStatus, resolveIrlMatchContext } from '@/lib/irl/service';

type RouteContext = {
  params: Promise<{ matchId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    if (!isIRLFeatureEnabled()) {
      return NextResponse.json({ featureEnabled: false }, { status: 200 });
    }

    const { matchId } = await context.params;
    if (!matchId?.trim()) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const irlContext = await resolveIrlMatchContext(supabase, user.id, matchId.trim());
    if (!irlContext) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const readiness = await getIrlReadinessStatus(supabase, irlContext, { featureEnabled: true });
    return NextResponse.json(readiness);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
