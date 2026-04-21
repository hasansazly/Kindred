import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { normalizeEmail, isTempleUniversityEmail } from '@/lib/utils';
import { resolveCoupleContext } from '@/server/couples/service';

type InvitePayload = {
  partnerEmail?: string;
};

type InviteRow = {
  id: string;
  inviter_user_id: string;
  partner_email: string;
  invite_code: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  created_at: string;
  expires_at: string;
};

function looksLikeMissingTable(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || Boolean(error.message?.includes(`public.${table}`));
}

function buildInviteLink(origin: string, code: string) {
  return `${origin}/app/couples?invite=${encodeURIComponent(code)}`;
}

function generateInviteCode() {
  return crypto.randomUUID().replace(/-/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userEmail = normalizeEmail(user.email ?? '');
    const templeEligible = isTempleUniversityEmail(userEmail);
    const context = await resolveCoupleContext(supabase, user.id);

    if (!templeEligible) {
      return NextResponse.json({
        canCreateInvite: false,
        reason: 'Only Temple users can invite a partner.',
        hasCouple: Boolean(context),
        pendingInvite: null,
      });
    }

    if (context) {
      return NextResponse.json({
        canCreateInvite: false,
        reason: 'You already have a confirmed couple.',
        hasCouple: true,
        pendingInvite: null,
      });
    }

    const { data: latestInvite, error } = await supabase
      .from('couple_invites')
      .select('id,inviter_user_id,partner_email,invite_code,status,created_at,expires_at')
      .eq('inviter_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<InviteRow>();

    if (error) {
      if (looksLikeMissingTable(error, 'couple_invites')) {
        return NextResponse.json({ error: 'Couple invite tables are not initialized yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    const pendingInvite = latestInvite
      ? {
          id: latestInvite.id,
          partnerEmail: latestInvite.partner_email,
          code: latestInvite.invite_code,
          status: latestInvite.status,
          createdAt: latestInvite.created_at,
          expiresAt: latestInvite.expires_at,
          inviteLink: buildInviteLink(origin, latestInvite.invite_code),
        }
      : null;

    return NextResponse.json({
      canCreateInvite: true,
      reason: null,
      hasCouple: false,
      pendingInvite,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userEmail = normalizeEmail(user.email ?? '');
    if (!isTempleUniversityEmail(userEmail)) {
      return NextResponse.json({ error: 'Only Temple users can invite a partner.' }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as InvitePayload;
    const partnerEmail = normalizeEmail(body.partnerEmail ?? '');
    if (!partnerEmail || !/\S+@\S+\.\S+/.test(partnerEmail)) {
      return NextResponse.json({ error: 'Valid partnerEmail is required.' }, { status: 400 });
    }
    if (partnerEmail === userEmail) {
      return NextResponse.json({ error: 'You cannot invite your own email.' }, { status: 400 });
    }

    const context = await resolveCoupleContext(supabase, user.id);
    if (context) {
      return NextResponse.json({ error: 'You already have a confirmed couple.' }, { status: 409 });
    }

    const { error: cancelError } = await supabase
      .from('couple_invites')
      .update({ status: 'cancelled' })
      .eq('inviter_user_id', user.id)
      .eq('status', 'pending');

    if (cancelError && !looksLikeMissingTable(cancelError, 'couple_invites')) {
      return NextResponse.json({ error: cancelError.message }, { status: 500 });
    }

    const inviteCode = generateInviteCode();
    const { data: created, error: createError } = await supabase
      .from('couple_invites')
      .insert({
        inviter_user_id: user.id,
        partner_email: partnerEmail,
        invite_code: inviteCode,
        status: 'pending',
      })
      .select('id,inviter_user_id,partner_email,invite_code,status,created_at,expires_at')
      .single<InviteRow>();

    if (createError) {
      if (looksLikeMissingTable(createError, 'couple_invites')) {
        return NextResponse.json({ error: 'Couple invite tables are not initialized yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const origin = new URL(request.url).origin;

    return NextResponse.json({
      ok: true,
      invite: {
        id: created.id,
        partnerEmail: created.partner_email,
        code: created.invite_code,
        status: created.status,
        createdAt: created.created_at,
        expiresAt: created.expires_at,
        inviteLink: buildInviteLink(origin, created.invite_code),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
