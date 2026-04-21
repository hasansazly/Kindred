import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';
import { isQaAccessEmail, normalizeEmail } from '@/lib/utils';

type LoginPayload = {
  email?: string;
  password?: string;
  next?: string;
};

function sanitizeNext(next: string | undefined) {
  const candidate = (next ?? '').trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '';
  if (candidate.startsWith('/auth')) return '';
  return candidate;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let body: LoginPayload = {};

    if (contentType.includes('application/json')) {
      body = (await request.json().catch(() => ({}))) as LoginPayload;
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const form = await request.formData();
      body = {
        email: typeof form.get('email') === 'string' ? String(form.get('email')) : '',
        password: typeof form.get('password') === 'string' ? String(form.get('password')) : '',
        next: typeof form.get('next') === 'string' ? String(form.get('next')) : '',
      };
    }

    const email = normalizeEmail(body.email ?? '');
    const password = typeof body.password === 'string' ? body.password : '';
    const safeNext = sanitizeNext(body.next);
    const wantsRedirect = !contentType.includes('application/json');

    if (!email || !password) {
      if (wantsRedirect) {
        return NextResponse.redirect(new URL('/auth/login?error=Email%20and%20password%20are%20required', request.url), 303);
      }
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (!isQaAccessEmail(email)) {
      if (wantsRedirect) {
        return NextResponse.redirect(new URL('/auth/login?error=Access%20is%20limited%20to%20approved%20tester%20emails', request.url), 303);
      }
      return NextResponse.json({ error: 'Access is limited to approved tester emails.' }, { status: 403 });
    }

    const supabase = await createSupabaseServerClient();
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (wantsRedirect) {
        const encoded = encodeURIComponent(error.message);
        return NextResponse.redirect(new URL(`/auth/login?error=${encoded}`, request.url), 303);
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      if (wantsRedirect) {
        return NextResponse.redirect(new URL('/auth/login?error=Sign%20in%20failed', request.url), 303);
      }
      return NextResponse.json({ error: 'Sign in failed.' }, { status: 400 });
    }

    if (wantsRedirect) {
      const redirectTo = safeNext || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url), 303);
    }

    if (safeNext) {
      return NextResponse.json({ ok: true, next: safeNext });
    }

    const { data: preferenceRow } = await supabase
      .from('match_preferences')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      next: preferenceRow ? '/dashboard' : '/onboarding',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
