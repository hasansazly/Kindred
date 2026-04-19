import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { isCoupleModeEnabled, pairIsDisabled, resolveCoupleContext } from '@/server/couples/service';

type LoveNoteRow = {
  id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
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
      return NextResponse.json({ notes: [] });
    }

    const context = await resolveCoupleContext(supabase, user.id);
    if (!context) {
      return NextResponse.json({ notes: [] });
    }

    if (await pairIsDisabled(supabase, user.id, context.partnerUserId)) {
      return NextResponse.json({ notes: [] });
    }

    const { data, error } = await supabase
      .from('couple_love_notes')
      .select('id,sender_user_id,body,created_at')
      .eq('couple_id', context.couple.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .returns<LoveNoteRow[]>();

    if (error) {
      if (looksLikeMissingTable(error, 'couple_love_notes')) {
        return NextResponse.json({ notes: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      notes: (data ?? []).map(note => ({
        id: note.id,
        body: note.body,
        createdAt: note.created_at,
        senderUserId: note.sender_user_id,
        isMine: note.sender_user_id === user.id,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
      return NextResponse.json({ error: 'Couple mode disabled' }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { body?: string };
    const noteText = typeof body.body === 'string' ? body.body.trim() : '';
    if (!noteText) {
      return NextResponse.json({ error: 'Note body is required' }, { status: 400 });
    }
    if (noteText.length > 600) {
      return NextResponse.json({ error: 'Note body is too long' }, { status: 400 });
    }

    const context = await resolveCoupleContext(supabase, user.id);
    if (!context) {
      return NextResponse.json({ error: 'Couple mode unavailable' }, { status: 403 });
    }

    if (await pairIsDisabled(supabase, user.id, context.partnerUserId)) {
      return NextResponse.json({ error: 'Couple mode unavailable for this pair' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('couple_love_notes')
      .insert({
        couple_id: context.couple.id,
        sender_user_id: user.id,
        body: noteText,
      })
      .select('id,sender_user_id,body,created_at')
      .single<LoveNoteRow>();

    if (error) {
      if (looksLikeMissingTable(error, 'couple_love_notes')) {
        return NextResponse.json({ error: 'Love notes table not available yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      note: {
        id: data.id,
        body: data.body,
        createdAt: data.created_at,
        senderUserId: data.sender_user_id,
        isMine: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
