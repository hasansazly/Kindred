import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl } from '../utils/supabase/env';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/auth');
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAppRoute = pathname.startsWith('/app');
  const isProtectedRoute = isOnboardingRoute || isDashboardRoute || isAppRoute;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  const onboardingComplete = profile?.onboarding_complete === true;

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(onboardingComplete ? '/dashboard' : '/onboarding', request.url)
    );
  }

  if (!onboardingComplete && (isDashboardRoute || isAppRoute)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (onboardingComplete && isOnboardingRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (
    isAuthRoute &&
    pathname !== '/auth/callback' &&
    pathname !== '/auth/auth-code-error'
  ) {
    return NextResponse.redirect(
      new URL(onboardingComplete ? '/dashboard' : '/onboarding', request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
