import { isIPv4, isIPv6 } from 'node:net';

export interface SignInFailurePolicy {
  scope: string;
  max: number;
  windowSeconds: number;
}

export const SIGN_IN_FAILURE_POLICIES = {
  perClient: { scope: 'sign-in-failure', max: 10, windowSeconds: 15 * 60 },
  perAccount: { scope: 'sign-in-failure-account', max: 100, windowSeconds: 60 * 60 },
} as const satisfies Record<string, SignInFailurePolicy>;

export type SignInAttemptResult = 'FAILED' | 'SUCCEEDED' | 'NOT_COUNTED';

export interface SignInThrottleKeys {
  perClient: string;
  perAccount: string;
}

export interface FailureCounter {
  count: number;
  windowStartedAt: number;
}

const IPV6_SUBNET_GROUPS = 4;

function expandIPv6(address: string): string[] {
  let value = address;
  const dotted = value.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (dotted && dotted.index !== undefined) {
    const [a, b, c, d] = dotted.slice(1, 5).map(Number);
    value = `${value.slice(0, dotted.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail] = value.split('::');
  const headGroups = head ? head.split(':') : [];
  if (tail === undefined) return headGroups.map((group) => parseInt(group, 16).toString(16));
  const tailGroups = tail ? tail.split(':') : [];
  const missing = Array<string>(8 - headGroups.length - tailGroups.length).fill('0');
  return [...headGroups, ...missing, ...tailGroups].map((group) =>
    parseInt(group, 16).toString(16),
  );
}

export function clientNetwork(address: string | null | undefined): string {
  const value = address?.trim().toLowerCase().split('%')[0] ?? '';
  if (!value) return 'unknown';
  if (isIPv4(value) || !isIPv6(value)) return value;
  const groups = expandIPv6(value);
  const mapped = groups.slice(0, 5).every((group) => group === '0') && groups[5] === 'ffff';
  if (mapped) {
    const high = parseInt(groups[6] ?? '0', 16);
    const low = parseInt(groups[7] ?? '0', 16);
    return [high >> 8, high & 255, low >> 8, low & 255].join('.');
  }
  return `${groups.slice(0, IPV6_SUBNET_GROUPS).join(':')}::/64`;
}

export function signInThrottleKeys(
  email: string,
  clientAddress: string | null | undefined,
  hash: (value: string) => string,
): SignInThrottleKeys {
  const normalizedEmail = email.trim().toLowerCase();
  return {
    perClient: `identity:${SIGN_IN_FAILURE_POLICIES.perClient.scope}:${hash(
      `${normalizedEmail}|${clientNetwork(clientAddress)}`,
    )}`,
    perAccount: `identity:${SIGN_IN_FAILURE_POLICIES.perAccount.scope}:${hash(normalizedEmail)}`,
  };
}

export function classifySignInAttempt(status: number): SignInAttemptResult {
  if (status >= 200 && status < 300) return 'SUCCEEDED';
  if (status === 401) return 'FAILED';
  return 'NOT_COUNTED';
}

export function failureWindowActive(
  counter: FailureCounter,
  policy: SignInFailurePolicy,
  now: number,
): boolean {
  return now - counter.windowStartedAt < policy.windowSeconds * 1_000;
}

export function isSignInBlocked(
  counter: FailureCounter | null,
  policy: SignInFailurePolicy,
  now: number,
): boolean {
  if (!counter) return false;
  return failureWindowActive(counter, policy, now) && counter.count >= policy.max;
}

export function retryAfterSeconds(
  counter: FailureCounter,
  policy: SignInFailurePolicy,
  now: number,
): number {
  const remaining = counter.windowStartedAt + policy.windowSeconds * 1_000 - now;
  return Math.max(1, Math.ceil(remaining / 1_000));
}
