import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl } from '../utils/supabase/env';

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/signup',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/callback',
  '/auth/auth-code-error',
  '/privacy',
  '/terms',
  '/safety',
  '/contact',
  '/blog',
  '/careers',
]);

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname);
}

export async function proxy(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // Always allow explicit public pages to avoid redirect loops.
    if (isPublicRoute(pathname)) {
      return NextResponse.next({ request });
    }

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
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    // Non-protected routes are always accessible.
    if (!user || !isProtectedRoute) {
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
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/app/:path*',
    '/matches/:path*',
  ],
};
