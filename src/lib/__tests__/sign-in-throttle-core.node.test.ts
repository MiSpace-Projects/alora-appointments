import {
  classifySignInAttempt,
  clientNetwork,
  isSignInBlocked,
  retryAfterSeconds,
  SIGN_IN_FAILURE_POLICIES,
  signInThrottleKeys,
} from '@/lib/sign-in-throttle-core';

const identityHash = (value: string): string => `h(${value})`;

describe('signInThrottleKeys', () => {
  it('keys the per-client limit on the email and the client address together', () => {
    const keys = signInThrottleKeys('Person@Example.com ', '203.0.113.7', identityHash);
    expect(keys.perClient).toBe('identity:sign-in-failure:h(person@example.com|203.0.113.7)');
  });

  it('gives an attacker on another address a different per-client key', () => {
    const victim = signInThrottleKeys('person@example.com', '203.0.113.7', identityHash);
    const attacker = signInThrottleKeys('person@example.com', '198.51.100.9', identityHash);
    expect(attacker.perClient).not.toBe(victim.perClient);
  });

  it('shares the per-account key across addresses', () => {
    const first = signInThrottleKeys('person@example.com', '203.0.113.7', identityHash);
    const second = signInThrottleKeys('PERSON@example.com', '198.51.100.9', identityHash);
    expect(first.perAccount).toBe(second.perAccount);
    expect(first.perAccount).toBe('identity:sign-in-failure-account:h(person@example.com)');
  });

  it('groups an IPv6 /64 into one client', () => {
    const first = signInThrottleKeys('person@example.com', '2001:db8:1:2::1', identityHash);
    const second = signInThrottleKeys(
      'person@example.com',
      '2001:db8:1:2:ffff:ffff:ffff:ffff',
      identityHash,
    );
    expect(first.perClient).toBe(second.perClient);
  });
});

describe('clientNetwork', () => {
  it('keeps IPv4 addresses as they are', () => {
    expect(clientNetwork(' 203.0.113.7 ')).toBe('203.0.113.7');
  });

  it('reduces IPv6 addresses to their /64 prefix', () => {
    expect(clientNetwork('2001:DB8:0:1::abcd')).toBe('2001:db8:0:1::/64');
    expect(clientNetwork('fe80::1%en0')).toBe('fe80:0:0:0::/64');
  });

  it('unwraps IPv4-mapped IPv6 addresses', () => {
    expect(clientNetwork('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('uses a shared bucket when the address is unknown', () => {
    expect(clientNetwork(null)).toBe('unknown');
    expect(clientNetwork('')).toBe('unknown');
  });
});

describe('classifySignInAttempt', () => {
  it('counts only rejected credentials as failures', () => {
    expect(classifySignInAttempt(401)).toBe('FAILED');
  });

  it('treats successful sign-ins as successes, never as attempts', () => {
    expect(classifySignInAttempt(200)).toBe('SUCCEEDED');
  });

  it('ignores validation, rate limit and server errors', () => {
    expect(classifySignInAttempt(400)).toBe('NOT_COUNTED');
    expect(classifySignInAttempt(403)).toBe('NOT_COUNTED');
    expect(classifySignInAttempt(429)).toBe('NOT_COUNTED');
    expect(classifySignInAttempt(500)).toBe('NOT_COUNTED');
  });
});

describe('isSignInBlocked', () => {
  const policy = SIGN_IN_FAILURE_POLICIES.perClient;
  const start = Date.UTC(2026, 10, 13, 8, 0, 0);

  it('does not block without recorded failures', () => {
    expect(isSignInBlocked(null, policy, start)).toBe(false);
  });

  it('allows attempts below the failure limit', () => {
    expect(isSignInBlocked({ count: policy.max - 1, windowStartedAt: start }, policy, start)).toBe(
      false,
    );
  });

  it('blocks once the failure limit is reached inside the window', () => {
    expect(
      isSignInBlocked({ count: policy.max, windowStartedAt: start }, policy, start + 60_000),
    ).toBe(true);
  });

  it('unblocks when the window has passed', () => {
    const later = start + policy.windowSeconds * 1_000;
    expect(isSignInBlocked({ count: policy.max, windowStartedAt: start }, policy, later)).toBe(
      false,
    );
  });

  it('keeps the per-account ceiling looser than the per-client limit', () => {
    expect(SIGN_IN_FAILURE_POLICIES.perAccount.max).toBeGreaterThan(
      SIGN_IN_FAILURE_POLICIES.perClient.max,
    );
  });

  it('reports the seconds left in the window', () => {
    expect(
      retryAfterSeconds({ count: policy.max, windowStartedAt: start }, policy, start + 60_000),
    ).toBe(policy.windowSeconds - 60);
  });
});
