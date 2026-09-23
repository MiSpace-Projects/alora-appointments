import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { loginWithCallback } from '@/lib/safe-redirect';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/two-factor',
];
const PROTECTED_PREFIXES = ['/profile'];

function isPublic(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_ROUTES.some((route) => route !== '/' && pathname.startsWith(route));
}

function buildCsp(nonce: string): string {
  const developmentDirectives =
    process.env.NODE_ENV === 'development' ? " 'unsafe-eval' ws: http:" : '';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${developmentDirectives}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.pexels.com https://challenges.cloudflare.com",
    "font-src 'self' data:",
    `connect-src 'self' https://challenges.cloudflare.com${developmentDirectives}`,
    'frame-src https://challenges.cloudflare.com',
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    'report-uri /api/security/csp-report',
    'report-to csp-endpoint',
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function applySecurityHeaders(response: NextResponse, csp: string): NextResponse {
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Reporting-Endpoints', 'csp-endpoint="/api/security/csp-report"');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const { pathname, search } = request.nextUrl;
  const returnTo = `${pathname}${search}`;
  const hasSession = Boolean(getSessionCookie(request));

  const needsAuth =
    PROTECTED_PREFIXES.some((route) => pathname.startsWith(route)) || !isPublic(pathname);

  if (!hasSession && needsAuth) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL(loginWithCallback(returnTo), request.url)),
      csp,
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-alora-return-to', returnTo);
  requestHeaders.set('Content-Security-Policy', csp);

  return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), csp);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
