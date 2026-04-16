import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl } from '../utils/supabase/env';

export async function proxy(request: NextRequest) {
  try {
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
    const isMatchesRoute = pathname.startsWith('/matches');
    const isProtectedRoute = isOnboardingRoute || isDashboardRoute || isAppRoute || isMatchesRoute;

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

    const { data: preferenceRow } = await supabase
      .from('match_preferences')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const onboardingComplete = !!preferenceRow;

    if (!onboardingComplete && (isDashboardRoute || isAppRoute || isMatchesRoute)) {
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
  } catch (error) {
    console.error('proxy auth guard failed:', error);
    const pathname = request.nextUrl.pathname;
    const isProtectedRoute =
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/app') ||
      pathname.startsWith('/matches');
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
