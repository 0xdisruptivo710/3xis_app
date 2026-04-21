import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password');
  const isPasswordReset = request.nextUrl.pathname.startsWith('/reset-password');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isPublicFile = request.nextUrl.pathname.startsWith('/_next') ||
                       request.nextUrl.pathname.startsWith('/favicon');

  if (isPublicFile || isApiRoute) {
    return supabaseResponse;
  }

  // Not authenticated — redirect to login
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated — check role for admin access (skip when on password reset, since
  // recovery sessions are temporary and the profile may belong to any role)
  if (user && !isAuthPage) {
    const { data: profile } = await supabase
      .from('x3_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'supervisor', 'super_admin'].includes(profile.role)) {
      // Not an admin or supervisor — deny access
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'unauthorized');
      // Sign out so they can log in with a different account
      await supabase.auth.signOut();
      return NextResponse.redirect(url);
    }
  }

  // Authenticated admin on auth page — redirect to dashboard (except on /reset-password)
  if (user && isAuthPage && !isPasswordReset) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
