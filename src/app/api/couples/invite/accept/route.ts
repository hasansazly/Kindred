import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../../utils/supabase/server';
import { isEduEmail, isTempleUniversityEmail, normalizeEmail } from '@/lib/utils';
import { resolveCoupleContext, sortPair } from '@/server/couples/service';

type AcceptPayload = {
  code?: string;
};

type InviteRow = {
  id: string;
  inviter_user_id: string;
  partner_email: string;
  invite_code: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  expires_at: string;
};

type CoupleRow = {
  id: string;
  user_one_id: string;
  user_two_id: string;
  status: 'confirmed' | 'inactive';
  confirmed_at: string | null;
};

type InviterProfileRow = {
  email?: string | null;
};

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as AcceptPayload;
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!code) return NextResponse.json({ error: 'Invite code is required.' }, { status: 400 });

    const { data: invite, error: inviteError } = await supabase
      .from('couple_invites')
      .select('id,inviter_user_id,partner_email,invite_code,status,expires_at')
      .eq('invite_code', code)
      .eq('status', 'pending')
      .maybeSingle<InviteRow>();

    if (inviteError) {
      if (looksLikeMissingTable(inviteError, 'couple_invites')) {
        return NextResponse.json({ error: 'Couple invite tables are not initialized yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found or no longer active.' }, { status: 404 });
    }

    if (invite.inviter_user_id === user.id) {
      return NextResponse.json({ error: 'You cannot accept your own invite.' }, { status: 400 });
    }

    const currentUserEmail = normalizeEmail(user.email ?? '');
    if (!isEduEmail(currentUserEmail)) {
      return NextResponse.json({ error: 'Only .edu emails can accept invites.' }, { status: 403 });
    }
    if (!currentUserEmail || currentUserEmail !== normalizeEmail(invite.partner_email)) {
      return NextResponse.json(
        { error: `This invite is locked to ${invite.partner_email}. Sign in with that email.` },
        { status: 403 }
      );
    }
    if (!isEduEmail(invite.partner_email)) {
      return NextResponse.json({ error: 'Only .edu emails can accept invites.' }, { status: 403 });
    }

    // Invite creation is already restricted to @temple.edu emails.
    // Keep a best-effort inviter email check, but do not hard-fail when email
    // is unavailable in `profiles` (can happen with RLS/profile hydration gaps).
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', invite.inviter_user_id)
      .maybeSingle<InviterProfileRow>();
    const inviterEmail = normalizeEmail(inviterProfile?.email ?? '');
    if (inviterEmail && !isTempleUniversityEmail(inviterEmail)) {
      return NextResponse.json({ error: 'Only invites sent by @temple.edu emails are valid.' }, { status: 403 });
    }

    const expiresAt = new Date(invite.expires_at).getTime();
    if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
      return NextResponse.json({ error: 'This invite has expired.' }, { status: 410 });
    }

    const existingContext = await resolveCoupleContext(supabase, user.id);
    if (existingContext) {
      return NextResponse.json({ error: 'You already have a confirmed couple.' }, { status: 409 });
    }

    const [userOneId, userTwoId] = sortPair(user.id, invite.inviter_user_id);

    const { data: existingPair, error: existingPairError } = await supabase
      .from('couples')
      .select('id,user_one_id,user_two_id,status,confirmed_at')
      .or(
        `and(user_one_id.eq.${userOneId},user_two_id.eq.${userTwoId}),and(user_one_id.eq.${userTwoId},user_two_id.eq.${userOneId})`
      )
      .eq('status', 'confirmed')
      .limit(1)
      .maybeSingle<CoupleRow>();

    if (existingPairError && !looksLikeMissingTable(existingPairError, 'couples')) {
      return NextResponse.json({ error: existingPairError.message }, { status: 500 });
    }

    let coupleId = existingPair?.id ?? null;

    if (!coupleId) {
      const { data: createdCouple, error: createCoupleError } = await supabase
        .from('couples')
        .insert({
          user_one_id: userOneId,
          user_two_id: userTwoId,
          status: 'confirmed',
        })
        .select('id')
        .single<{ id: string }>();

      if (createCoupleError) {
        if (looksLikeMissingTable(createCoupleError, 'couples')) {
          return NextResponse.json({ error: 'Couple mode tables are not initialized yet.' }, { status: 503 });
        }
        return NextResponse.json({ error: createCoupleError.message }, { status: 500 });
      }

      coupleId = createdCouple.id;
    }

    const { error: updateInviteError } = await supabase
      .from('couple_invites')
      .update({
        status: 'accepted',
        accepted_by_user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id)
      .eq('status', 'pending');

    if (updateInviteError) {
      return NextResponse.json({ error: updateInviteError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      coupleId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
