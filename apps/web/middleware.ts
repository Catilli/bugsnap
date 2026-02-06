import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token in cookies (set by persist middleware) or auth-storage
  // Note: Main auth guard is client-side via authStore; this is a safety net
  const authStorage = request.cookies.get('auth-storage')?.value;
  let isAuthenticated = false;

  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      isAuthenticated = !!parsed?.state?.token;
    } catch {
      // Invalid cookie
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
