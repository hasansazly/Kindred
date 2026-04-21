import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { ensureConnectionTrackForPair } from '@/server/connectionTrack/service';
import { getCoupleModeState } from '@/server/couples/mode';

function toInClause(ids: string[]): string {
  return `(${ids.map(id => `'${id.replace(/'/g, "''")}'`).join(',')})`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawMatchUserId = typeof body?.matchUserId === 'string' ? body.matchUserId : '';
    const matchUserId = rawMatchUserId.trim().replace(/^"+|"+$/g, '');

    if (!matchUserId) {
      return NextResponse.json({ error: 'matchUserId is required' }, { status: 400 });
    }
    if (!UUID_RE.test(matchUserId)) {
      return NextResponse.json({ error: 'Invalid matchUserId format' }, { status: 400 });
    }

    if (matchUserId === user.id) {
      return NextResponse.json({ error: 'Cannot start conversation with yourself' }, { status: 400 });
    }

    const coupleMode = await getCoupleModeState(supabase, user.id);
    if (
      coupleMode.featureEnabled &&
      coupleMode.hasCouple &&
      coupleMode.selfEnabled &&
      coupleMode.partnerUserId &&
      matchUserId !== coupleMode.partnerUserId
    ) {
      return NextResponse.json(
        { error: 'Couple Mode is ON. You can only message your confirmed partner.' },
        { status: 403 }
      );
    }

    const { data: matchRow, error: matchCheckError } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('matched_user_id', matchUserId)
      .eq('status', 'active')
      .maybeSingle();

    if (matchCheckError) {
      return NextResponse.json({ error: matchCheckError.message }, { status: 500 });
    }

    if (!matchRow) {
      return NextResponse.json({ error: 'No active match found for this user' }, { status: 403 });
    }

    const [{ data: blockRows }, { data: unmatchRows }] = await Promise.all([
      supabase
        .from('blocks')
        .select('blocker_user_id,blocked_user_id')
        .or(
          `and(blocker_user_id.eq.${user.id},blocked_user_id.eq.${matchUserId}),and(blocker_user_id.eq.${matchUserId},blocked_user_id.eq.${user.id})`
        ),
      supabase
        .from('unmatches')
        .select('initiated_by_user_id,unmatched_user_id')
        .or(
          `and(initiated_by_user_id.eq.${user.id},unmatched_user_id.eq.${matchUserId}),and(initiated_by_user_id.eq.${matchUserId},unmatched_user_id.eq.${user.id})`
        ),
    ]);

    if ((blockRows ?? []).length > 0) {
      return NextResponse.json({ error: 'Messaging is unavailable for this match.' }, { status: 403 });
    }

    if ((unmatchRows ?? []).length > 0) {
      return NextResponse.json({ error: 'This connection was unmatched.' }, { status: 403 });
    }

    const disabledReason =
      typeof (matchRow as { conversation_disabled_reason?: unknown }).conversation_disabled_reason === 'string'
        ? ((matchRow as { conversation_disabled_reason?: string }).conversation_disabled_reason ?? '').trim()
        : '';
    const conversationDisabled = Boolean((matchRow as { conversation_disabled?: unknown }).conversation_disabled);

    if (conversationDisabled) {
      return NextResponse.json(
        { error: disabledReason || 'Messaging is disabled for this match.' },
        { status: 403 }
      );
    }

    const { data: myParticipantRows, error: myParticipantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myParticipantError) {
      return NextResponse.json({ error: myParticipantError.message }, { status: 500 });
    }

    const ownedConversationIds = (myParticipantRows ?? []).map(row => row.conversation_id);

    if (ownedConversationIds.length > 0) {
      const { data: participantRows, error: pairLookupError } = await supabase
        .from('conversation_participants')
        .select('conversation_id,user_id')
        .filter('conversation_id', 'in', toInClause(ownedConversationIds));

      if (pairLookupError) {
        return NextResponse.json({ error: pairLookupError.message }, { status: 500 });
      }

      const sharedIds = new Set<string>();
      const grouped = new Map<string, Set<string>>();
      for (const row of participantRows ?? []) {
        const set = grouped.get(row.conversation_id) ?? new Set<string>();
        if (row.user_id === user.id || row.user_id === matchUserId) {
          set.add(row.user_id);
        }
        grouped.set(row.conversation_id, set);
      }

      for (const [conversationId, users] of grouped.entries()) {
        if (users.has(user.id) && users.has(matchUserId)) {
          sharedIds.add(conversationId);
        }
      }

      if (sharedIds.size > 0) {
        const sharedConversationIds = [...sharedIds];
        const { data: directConversationRows, error: directLookupError } = await supabase
          .from('conversations')
          .select('id,created_at')
          .eq('kind', 'direct')
          .filter('id', 'in', toInClause(sharedConversationIds))
          .order('created_at', { ascending: true })
          .limit(1);

        if (directLookupError) {
          return NextResponse.json({ error: directLookupError.message }, { status: 500 });
        }

        if (directConversationRows && directConversationRows.length > 0) {
          try {
            await ensureConnectionTrackForPair(supabase, {
              userA: user.id,
              userB: matchUserId,
              matchId: matchRow.id,
              conversationId: directConversationRows[0].id,
            });
          } catch {
            // Non-blocking: messaging should still work if Connection Track tables are not ready.
          }
          return NextResponse.json({ conversationId: directConversationRows[0].id, created: false });
        }
      }
    }

    const { data: newConversation, error: createConversationError } = await supabase
      .from('conversations')
      .insert({
        kind: 'direct',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (createConversationError || !newConversation) {
      return NextResponse.json({ error: createConversationError?.message ?? 'Failed to create conversation' }, { status: 500 });
    }

    const { error: participantsInsertError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConversation.id, user_id: user.id },
        { conversation_id: newConversation.id, user_id: matchUserId },
      ]);

    if (participantsInsertError) {
      return NextResponse.json({ error: participantsInsertError.message }, { status: 500 });
    }

    try {
      await ensureConnectionTrackForPair(supabase, {
        userA: user.id,
        userB: matchUserId,
        matchId: matchRow.id,
        conversationId: newConversation.id,
      });
    } catch {
      // Non-blocking: messaging should still work if Connection Track tables are not ready.
    }

    return NextResponse.json({ conversationId: newConversation.id, created: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
