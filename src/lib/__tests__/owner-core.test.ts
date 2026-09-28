import { parseOwnerAllowlist, isOwnerEmail } from '@/lib/owner-core';

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
