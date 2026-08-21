/** @jest-environment node */

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
});
