import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication checks for Server Actions
  // Server Actions have their own server-side authentication via guard functions
  if (request.headers.get('next-action')) {
    return NextResponse.next();
  }

  // Skip static assets, api routes, and public files
  // Also public root '/' and '/stok-publik' are public customer stock views
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/stok-publik') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.webmanifest') ||
    pathname.startsWith('/icon-192.png') ||
    pathname.startsWith('/icon-512.png') ||
    pathname.startsWith('/apple-icon.png') ||
    pathname.startsWith('/icon.png')
  ) {
    return NextResponse.next();
  }

  // Better Auth session cookie check (supports both http and https cookie prefixes)
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token');

  // If visiting /login while having session cookie, hint redirect to /dashboard
  if (pathname === '/login') {
    if (sessionCookie?.value) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // If visiting protected routes without session cookie, hint redirect to /login
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
