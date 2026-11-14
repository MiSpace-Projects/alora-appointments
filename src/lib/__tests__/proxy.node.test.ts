import { getSessionCookie } from 'better-auth/cookies';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

jest.mock('better-auth/cookies', () => ({
  getSessionCookie: jest.fn(),
}));

const mockedGetSessionCookie = jest.mocked(getSessionCookie);

describe('proxy authentication redirects', () => {
  beforeEach(() => {
    mockedGetSessionCookie.mockReset();
  });

  it('allows login to render when only an unverified session cookie is present', () => {
    mockedGetSessionCookie.mockReturnValue('expired-session');

    const response = proxy(new NextRequest('http://localhost/login?callbackUrl=%2Fbook'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects a signed-out booking request to login with its callback', () => {
    mockedGetSessionCookie.mockReturnValue(null);

    const response = proxy(new NextRequest('http://localhost/book'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/login?callbackUrl=%2Fbook');
  });

  it.each(['/book', '/book/payment', '/book/payment/receipt/abc', '/profile', '/owner'])(
    'redirects signed-out visitors away from the protected path %s',
    (path) => {
      mockedGetSessionCookie.mockReturnValue(null);

      const response = proxy(new NextRequest(`http://localhost${path}?step=2`));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        `http://localhost/login?callbackUrl=${encodeURIComponent(`${path}?step=2`)}`,
      );
    },
  );

  it.each([
    '/',
    '/nope',
    '/services',
    '/services/nail-art',
    '/servicesX',
    '/bookings',
    '/profiles',
    '/owners',
    '/privacy-policy',
    '/paia-manual',
  ])('lets Next render %s for signed-out visitors', (path) => {
    mockedGetSessionCookie.mockReturnValue(null);

    const response = proxy(new NextRequest(`http://localhost${path}`));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('lets a signed-in visitor through to a protected path', () => {
    mockedGetSessionCookie.mockReturnValue('session-token');

    const response = proxy(new NextRequest('http://localhost/profile'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('sets a nonce based content security policy on every response', () => {
    mockedGetSessionCookie.mockReturnValue(null);

    const passed = proxy(new NextRequest('http://localhost/nope'));
    const redirected = proxy(new NextRequest('http://localhost/book'));

    for (const response of [passed, redirected]) {
      const csp = response.headers.get('content-security-policy') ?? '';
      expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    }
  });

  it.each(['/services/does-not-exist', '/services/wig-frontal-replacement', '/services/%E0%A4%A'])(
    'rewrites the unknown service page %s to the not-found route',
    (path) => {
      mockedGetSessionCookie.mockReturnValue(null);

      const response = proxy(new NextRequest(`http://localhost${path}`));

      expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost/_not-found');
      expect(response.headers.get('content-security-policy')).toContain("'strict-dynamic'");
    },
  );

  it.each([
    '/services/wig-care',
    '/services/customization-styling',
    '/services/nail-art',
    '/services/makeup',
    '/services/matric-farewell',
  ])('lets the service family page %s render', (path) => {
    mockedGetSessionCookie.mockReturnValue(null);

    const response = proxy(new NextRequest(`http://localhost${path}`));

    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
