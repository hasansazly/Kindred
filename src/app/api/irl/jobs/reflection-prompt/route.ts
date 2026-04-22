import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../../utils/supabase/admin';
import { isIRLFeatureEnabled } from '@/lib/irl/featureFlag';

type IntentionRow = {
  match_id: string;
  user_id: string;
  submitted_at: string;
};

type ReflectionRow = {
  match_id: string;
  user_id: string;
};

type TrackRow = {
  id: string;
  match_id: string;
};

type EventRow = {
  connection_track_id: string;
  metadata: Record<string, unknown> | null;
};

function hasCronAccess(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ?? '';
  const header = request.headers.get('x-cron-secret')?.trim() ?? '';
  return bearer === secret || header === secret;
}

export async function GET(req: Request) {
  try {
    if (!isIRLFeatureEnabled()) {
      return NextResponse.json({ ok: true, featureEnabled: false, processed: 0 });
    }

    if (!hasCronAccess(req)) {
      return NextResponse.json({ error: 'Unauthorized cron access' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: intentionRows, error: intentionError } = await supabase
      .from('irl_intentions')
      .select('match_id,user_id,submitted_at')
      .lte('submitted_at', threshold)
      .returns<IntentionRow[]>();

    if (intentionError) {
      return NextResponse.json({ error: intentionError.message }, { status: 500 });
    }

    const byMatch = new Map<string, IntentionRow[]>();
    for (const row of intentionRows ?? []) {
      const current = byMatch.get(row.match_id) ?? [];
      current.push(row);
      byMatch.set(row.match_id, current);
    }

    const dueMatchIds = Array.from(byMatch.entries())
      .filter(([, rows]) => {
        const users = new Set(rows.map(row => row.user_id));
        if (users.size < 2) return false;
        const latestSubmittedTs = rows
          .map(row => new Date(row.submitted_at).getTime())
          .filter(ts => Number.isFinite(ts))
          .sort((a, b) => b - a)[0];
        return Number.isFinite(latestSubmittedTs) && latestSubmittedTs <= Date.now() - 24 * 60 * 60 * 1000;
      })
      .map(([matchId]) => matchId);

    if (dueMatchIds.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, dueMatchIds: [] });
    }

    const [{ data: reflectionRows }, { data: tracks }] = await Promise.all([
      supabase
        .from('irl_reflections')
        .select('match_id,user_id')
        .in('match_id', dueMatchIds)
        .returns<ReflectionRow[]>(),
      supabase
        .from('connection_tracks')
        .select('id,match_id')
        .in('match_id', dueMatchIds)
        .eq('status', 'active')
        .returns<TrackRow[]>(),
    ]);

    const reflectionByMatch = new Map<string, Set<string>>();
    for (const row of reflectionRows ?? []) {
      const existing = reflectionByMatch.get(row.match_id) ?? new Set<string>();
      existing.add(row.user_id);
      reflectionByMatch.set(row.match_id, existing);
    }

    const trackByMatch = new Map((tracks ?? []).map((track: TrackRow) => [track.match_id, track.id]));
    const eligibleMatchIds = dueMatchIds.filter(matchId => {
      const reflectionUsers = reflectionByMatch.get(matchId);
      return !reflectionUsers || reflectionUsers.size < 2;
    });

    if (eligibleMatchIds.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, dueMatchIds: [] });
    }

    const trackIds = eligibleMatchIds
      .map(matchId => trackByMatch.get(matchId))
      .filter((value): value is string => Boolean(value));

    const { data: existingEvents } = await supabase
      .from('connection_track_events')
      .select('connection_track_id,metadata')
      .in('connection_track_id', trackIds)
      .eq('event_type', 'irl_reflection_prompt_due')
      .gte('created_at', new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString())
      .returns<EventRow[]>();

    const alreadyTriggered = new Set<string>();
    for (const event of existingEvents ?? []) {
      const matchId = typeof event.metadata?.match_id === 'string' ? event.metadata.match_id : '';
      if (matchId) alreadyTriggered.add(matchId);
    }

    const eventsToInsert: Array<{
      connection_track_id: string;
      event_type: string;
      metadata: { match_id: string; triggered_at: string };
    }> = [];

    for (const matchId of eligibleMatchIds) {
      if (alreadyTriggered.has(matchId)) continue;
      const trackId = trackByMatch.get(matchId);
      if (!trackId) continue;
      eventsToInsert.push({
        connection_track_id: trackId,
        event_type: 'irl_reflection_prompt_due',
        metadata: {
          match_id: matchId,
          triggered_at: new Date().toISOString(),
        },
      });
    }

    if (eventsToInsert.length > 0) {
      const { error: eventError } = await supabase.from('connection_track_events').insert(eventsToInsert);
      if (eventError) {
        return NextResponse.json({ error: eventError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: eventsToInsert.length,
      dueMatchIds: eligibleMatchIds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
