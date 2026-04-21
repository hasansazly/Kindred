import { NextResponse } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl } from '../../../../../utils/supabase/env';
import { isQaAccessEmail, normalizeEmail } from '@/lib/utils';

const getErrorDetails = (error: unknown) => {
  const e = error as {
    message?: string;
    cause?: { message?: string; code?: string; errno?: string; syscall?: string };
  };
  const top = e?.message || 'Unknown server error';
  const causeMessage = e?.cause?.message;
  const causeCode = e?.cause?.code || e?.cause?.errno;
  const causeSyscall = e?.cause?.syscall;
  const parts = [top];
  if (causeCode) parts.push(`code=${causeCode}`);
  if (causeSyscall) parts.push(`syscall=${causeSyscall}`);
  if (causeMessage) parts.push(`cause=${causeMessage}`);
  return parts.join(' | ');
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const shouldCreateUser = Boolean(body?.shouldCreateUser);

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (!isQaAccessEmail(email)) {
      return NextResponse.json(
        { error: 'Access is limited to approved tester emails.' },
        { status: 403 }
      );
    }

    const supabaseUrl = getSupabaseUrl();
    const publishableKey = getSupabasePublishableKey();
    const origin = new URL(request.url).origin;
    const emailRedirectTo = `${origin}/auth/callback?next=/onboarding`;
    const otpUrl = `${supabaseUrl}/auth/v1/otp`;
    const response = await fetch(otpUrl, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        create_user: shouldCreateUser,
        email_redirect_to: emailRedirectTo,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json({
        error: message || `Supabase OTP request failed with status ${response.status}`,
      }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const supabaseUrl = getSupabaseUrl();
    const host = (() => {
      try {
        return new URL(supabaseUrl).host;
      } catch {
        return 'invalid-url';
      }
    })();
    const message = getErrorDetails(error);
    console.error('send-code route failed:', error);
    return NextResponse.json(
      { error: `Unable to send verification code. host=${host} | ${message}` },
      { status: 500 }
    );
  }
}
