import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { loginWithCallback } from '@/lib/safe-redirect';
import { buildCsp } from '@/lib/csp';
import { getServiceFamily } from '@/app/features/servicesSection/servicesData';

const PROTECTED_PREFIXES = ['/book', '/profile', '/owner'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const SERVICE_FAMILY_PATH = /^\/services\/([^/]+)$/;

function isUnknownServiceFamily(pathname: string): boolean {
  const match = SERVICE_FAMILY_PATH.exec(pathname);
  if (!match) return false;
  try {
    return !getServiceFamily(decodeURIComponent(match[1]));
  } catch {
    return true;
  }
}

function applySecurityHeaders(response: NextResponse, csp: string): NextResponse {
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Reporting-Endpoints', 'csp-endpoint="/api/security/csp-report"');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, process.env.NODE_ENV);
  const { pathname, search } = request.nextUrl;
  const returnTo = `${pathname}${search}`;
  const hasSession = Boolean(getSessionCookie(request));

  if (!hasSession && isProtectedPath(pathname)) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL(loginWithCallback(returnTo), request.url)),
      csp,
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-alora-return-to', returnTo);
  requestHeaders.set('Content-Security-Policy', csp);

  if (isUnknownServiceFamily(pathname)) {
    return applySecurityHeaders(
      NextResponse.rewrite(new URL('/_not-found', request.url), {
        request: { headers: requestHeaders },
      }),
      csp,
    );
  }

  return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), csp);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
