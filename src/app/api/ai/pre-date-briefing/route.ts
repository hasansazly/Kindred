import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { findMatchById, getMatchesForUser } from '@/lib/matches';
import { getPreDateBriefingForMatch } from '@/server/ai/preDateBriefing';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { matchId?: string };
    const matchId = body.matchId?.trim();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matches = await getMatchesForUser(supabase, user.id);
    const match = findMatchById(matches, matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (!match.isMutualMatch) {
      return NextResponse.json({ error: 'Briefing requires a mutual match' }, { status: 403 });
    }

    const result = await getPreDateBriefingForMatch({
      supabase,
      viewerUserId: user.id,
      match,
    });

    if (result.status !== 'ok' || !result.briefing) {
      return NextResponse.json({ status: 'unavailable', reason: result.reason ?? 'unavailable' });
    }

    return NextResponse.json({
      status: 'ok',
      source: result.source,
      briefing: result.briefing,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate pre-date briefing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
