import { getAuthenticatedEntryRedirect } from '@/lib/auth-entry-redirect';

describe('getAuthenticatedEntryRedirect', () => {
  it('preserves the requested destination for a signed-in login visit', () => {
    expect(getAuthenticatedEntryRedirect('/login?callbackUrl=%2Fbook')).toBe('/book');
  });

  it('sends a signed-in registration visit home when no callback is present', () => {
    expect(getAuthenticatedEntryRedirect('/register')).toBe('/');
  });

  it('does not redirect authenticated users away from other auth routes', () => {
    expect(getAuthenticatedEntryRedirect('/forgot-password')).toBeNull();
  });

  it('rejects an off-origin callback destination', () => {
    expect(getAuthenticatedEntryRedirect('/login?callbackUrl=https%3A%2F%2Fevil.example')).toBe(
      '/',
    );
  });
});
