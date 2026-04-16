import { NextResponse } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl } from '../../../../../utils/supabase/env';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email : '';
    const shouldCreateUser = Boolean(body?.shouldCreateUser);

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const supabaseUrl = getSupabaseUrl();
    const publishableKey = getSupabasePublishableKey();
    const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        create_user: shouldCreateUser,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        { error: message || `Supabase OTP request failed with status ${response.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('send-code route failed:', error);
    return NextResponse.json({ error: `Unable to send verification code. ${message}` }, { status: 500 });
  }
}
