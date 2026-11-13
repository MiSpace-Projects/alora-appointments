import { deletionRequirement, hasCredentialPassword } from '@/lib/account-deletion';

const now = Date.UTC(2026, 10, 13, 9, 0, 0);
const freshAgeSeconds = 10 * 60;
const base = {
  passwordProvided: false,
  tokenProvided: false,
  sessionCreatedAt: new Date(now - 60_000),
  now,
  freshAgeSeconds,
};

describe('hasCredentialPassword', () => {
  it('detects a credential account with a password', () => {
    expect(hasCredentialPassword([{ providerId: 'credential', password: 'hash' }])).toBe(true);
  });

  it('treats social-only accounts as having no password', () => {
    expect(hasCredentialPassword([{ providerId: 'google', password: null }])).toBe(false);
    expect(hasCredentialPassword([{ providerId: 'credential', password: null }])).toBe(false);
    expect(hasCredentialPassword([])).toBe(false);
  });
});

describe('deletionRequirement', () => {
  it('requires the password from users who have one', () => {
    expect(deletionRequirement({ ...base, hasPassword: true })).toBe('PASSWORD_REQUIRED');
    expect(deletionRequirement({ ...base, hasPassword: true, passwordProvided: true })).toBe(
      'ALLOWED',
    );
  });

  it('lets social-only users delete from a fresh session without a password', () => {
    expect(deletionRequirement({ ...base, hasPassword: false })).toBe('ALLOWED');
  });

  it('asks social-only users with an old session to sign in again', () => {
    expect(
      deletionRequirement({
        ...base,
        hasPassword: false,
        sessionCreatedAt: new Date(now - freshAgeSeconds * 1_000),
      }),
    ).toBe('REAUTHENTICATE');
  });

  it('lets the emailed confirmation token through', () => {
    expect(
      deletionRequirement({
        ...base,
        hasPassword: true,
        tokenProvided: true,
        sessionCreatedAt: new Date(0),
      }),
    ).toBe('ALLOWED');
  });
});
