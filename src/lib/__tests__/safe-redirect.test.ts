import { sanitizeRedirect, loginWithCallback } from '@/lib/safe-redirect';

describe('sanitizeRedirect', () => {
  it('allows a normal same-origin path', () => {
    expect(sanitizeRedirect('/profile')).toBe('/profile');
  });

  it('preserves query string and hash', () => {
    expect(sanitizeRedirect('/profile?tab=past#top')).toBe('/profile?tab=past#top');
  });

  it('rejects protocol-relative URLs (open-redirect vector)', () => {
    expect(sanitizeRedirect('//evil.com')).toBe('/');
  });

  it('rejects backslash-obfuscated protocol-relative URLs', () => {
    expect(sanitizeRedirect('/\\evil.com')).toBe('/');
    expect(sanitizeRedirect('\\/evil.com')).toBe('/');
  });

  it('rejects absolute URLs with a scheme', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe('/');
    expect(sanitizeRedirect('http://evil.com/path')).toBe('/');
  });

  it('rejects non-path input', () => {
    expect(sanitizeRedirect('evil.com')).toBe('/');
    expect(sanitizeRedirect('javascript:alert(1)')).toBe('/');
  });

  it('falls back for empty, null or undefined input', () => {
    expect(sanitizeRedirect('')).toBe('/');
    expect(sanitizeRedirect(null)).toBe('/');
    expect(sanitizeRedirect(undefined)).toBe('/');
  });

  it('honours a custom fallback', () => {
    expect(sanitizeRedirect('//evil.com', '/login')).toBe('/login');
  });
});

describe('loginWithCallback', () => {
  it('builds a login URL with an encoded, sanitised callback', () => {
    expect(loginWithCallback('/profile')).toBe('/login?callbackUrl=%2Fprofile');
  });

  it('never embeds an off-origin destination', () => {
    expect(loginWithCallback('//evil.com')).toBe('/login?callbackUrl=%2F');
  });
});
