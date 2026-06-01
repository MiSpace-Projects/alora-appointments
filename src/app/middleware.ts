import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
const REDIRECT_IF_AUTHED = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isRedirectIfAuthed = REDIRECT_IF_AUTHED.some((r) => pathname.startsWith(r));

  if (sessionToken && isRedirectIfAuthed) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!sessionToken && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);

    if (pathname.startsWith('/')) {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
