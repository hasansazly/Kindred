import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const stripEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value.trim().replace(/^['"]|['"]$/g, '');
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email : '';
    const token = typeof body?.token === 'string' ? body.token : '';

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      stripEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
      stripEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
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
