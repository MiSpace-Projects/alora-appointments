import { parseOwnerAllowlist, isOwnerEmail, isOwnerUser } from '@/lib/owner-core';

describe('parseOwnerAllowlist', () => {
  it('splits, trims, lowercases and drops empties', () => {
    expect(parseOwnerAllowlist(' Owner@Alora.co.za , second@x.com ,')).toEqual([
      'owner@alora.co.za',
      'second@x.com',
    ]);
  });

  it('returns an empty list for undefined or blank input', () => {
    expect(parseOwnerAllowlist(undefined)).toEqual([]);
    expect(parseOwnerAllowlist('   ')).toEqual([]);
  });
});

describe('isOwnerEmail', () => {
  const allow = ['owner@alora.co.za'];

  it('matches case-insensitively', () => {
    expect(isOwnerEmail('Owner@Alora.co.za', allow)).toBe(true);
    expect(isOwnerEmail('owner@alora.co.za', allow)).toBe(true);
  });

  it('rejects non-owners', () => {
    expect(isOwnerEmail('someone@else.com', allow)).toBe(false);
  });

  it('rejects when the allowlist is empty (fails closed)', () => {
    expect(isOwnerEmail('owner@alora.co.za', [])).toBe(false);
  });

  it('rejects null or empty email', () => {
    expect(isOwnerEmail(null, allow)).toBe(false);
    expect(isOwnerEmail('', allow)).toBe(false);
  });
});

describe('isOwnerUser', () => {
  const allow = ['owner@alora.co.za'];

  it('accepts an allowlisted owner whose email is verified', () => {
    expect(isOwnerUser({ email: 'Owner@Alora.co.za', emailVerified: true }, allow)).toBe(true);
  });

  it('rejects an allowlisted email that has not been verified', () => {
    expect(isOwnerUser({ email: 'owner@alora.co.za', emailVerified: false }, allow)).toBe(false);
    expect(isOwnerUser({ email: 'owner@alora.co.za', emailVerified: null }, allow)).toBe(false);
  });

  it('rejects a verified user who is not on the allowlist', () => {
    expect(isOwnerUser({ email: 'someone@else.com', emailVerified: true }, allow)).toBe(false);
  });

  it('rejects a missing user', () => {
    expect(isOwnerUser(null, allow)).toBe(false);
  });
});
