import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { loginWithCallback } from '@/lib/safe-redirect';

/**
 * Edge proxy (formerly "middleware") — the FIRST, optimistic auth gate.
 *
 * Renamed to `proxy` per Next.js 16's convention. Runs on the edge runtime and
 * cannot touch the database, so it only does a cheap cookie-presence check to
 * steer navigation (bounce signed-in users off /login, bounce signed-out users
 * off protected pages). It is intentionally NOT the security boundary: a cookie
 * can be forged or stale. The real, database-backed session check lives in
 * `(protected)/layout.tsx` (`auth.api.getSession`). Layered on purpose — this
 * is UX speed, that is truth.
 */

// Routes reachable without a session. `/` (marketing homepage) is public.
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

// Signed-in users have no reason to see these; send them home.
const REDIRECT_IF_AUTHED = ['/login', '/register'];

// Everything the app renders that is NOT public requires a session.
const PROTECTED_PREFIXES = ['/profile'];

function isPublic(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_ROUTES.some((route) => route !== '/' && pathname.startsWith(route));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = Boolean(getSessionCookie(request));

  if (hasSession && REDIRECT_IF_AUTHED.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const needsAuth =
    PROTECTED_PREFIXES.some((route) => pathname.startsWith(route)) || !isPublic(pathname);

  if (!hasSession && needsAuth) {
    return NextResponse.redirect(new URL(loginWithCallback(pathname), request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip API routes, Next internals and static assets — auth for API handlers is
  // enforced by better-auth itself, not here.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
