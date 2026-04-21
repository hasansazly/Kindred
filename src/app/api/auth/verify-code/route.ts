import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl } from '../../../../../utils/supabase/env';
import { isQaAccessEmail, normalizeEmail } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const token = typeof body?.token === 'string' ? body.token : '';

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    if (!isQaAccessEmail(email)) {
      return NextResponse.json(
        { error: 'Access is limited to approved tester emails.' },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('verify-code route failed:', error);
    return NextResponse.json({ error: `Unable to verify code. ${message}` }, { status: 500 });
  }
}
