import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { fingerprint } from './security-events';
import {
  classifySignInAttempt,
  isSignInBlocked,
  retryAfterSeconds,
  SIGN_IN_FAILURE_POLICIES,
  signInThrottleKeys,
  type FailureCounter,
  type SignInFailurePolicy,
} from './sign-in-throttle-core';

interface ThrottlePolicy {
  scope: string;
  max: number;
  windowSeconds: number;
}

interface RateLimitRow {
  count: number;
  lastRequest: bigint;
}

const POLICIES: Record<string, ThrottlePolicy> = {
  '/sign-up/email': { scope: 'sign-up', max: 5, windowSeconds: 60 * 60 },
  '/request-password-reset': { scope: 'password-reset-request', max: 5, windowSeconds: 60 * 60 },
  '/send-verification-email': { scope: 'verification-email', max: 5, windowSeconds: 60 * 60 },
};

export class IdentityRateLimitError extends Error {
  constructor(public readonly retryAfter: number) {
    super('Identity rate limit exceeded');
    this.name = 'IdentityRateLimitError';
  }
}

export function getIdentityPolicy(pathname: string): ThrottlePolicy | null {
  return POLICIES[pathname] ?? null;
}

export async function consumeIdentityThrottle(
  policy: ThrottlePolicy,
  identity: string,
): Promise<void> {
  const key = `identity:${policy.scope}:${fingerprint(identity)}`;
  const now = Date.now();
  const cutoff = BigInt(now - policy.windowSeconds * 1_000);
  const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${randomUUID()}, ${key}, 1, ${BigInt(now)})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rateLimit"."lastRequest" < ${cutoff} THEN 1
        ELSE "rateLimit"."count" + 1
      END,
      "lastRequest" = ${BigInt(now)}
    RETURNING "count", "lastRequest"
  `);

  const count = rows[0]?.count ?? 1;
  if (count > policy.max) {
    throw new IdentityRateLimitError(policy.windowSeconds);
  }
}

export async function consumeNamedThrottle({
  scope,
  identity,
  max,
  windowSeconds,
}: {
  scope: string;
  identity: string;
  max: number;
  windowSeconds: number;
}): Promise<void> {
  return consumeIdentityThrottle({ scope, max, windowSeconds }, identity);
}

async function recordFailure(key: string, policy: SignInFailurePolicy, now: number): Promise<void> {
  const cutoff = BigInt(now - policy.windowSeconds * 1_000);
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${randomUUID()}, ${key}, 1, ${BigInt(now)})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rateLimit"."lastRequest" < ${cutoff} THEN 1
        ELSE "rateLimit"."count" + 1
      END,
      "lastRequest" = CASE
        WHEN "rateLimit"."lastRequest" < ${cutoff} THEN ${BigInt(now)}
        ELSE "rateLimit"."lastRequest"
      END
  `);
}

export async function getSignInRetryAfter(
  email: string,
  clientAddress: string | null,
): Promise<number | null> {
  const keys = signInThrottleKeys(email, clientAddress, fingerprint);
  const rows = await prisma.rateLimit.findMany({
    where: { key: { in: [keys.perClient, keys.perAccount] } },
    select: { key: true, count: true, lastRequest: true },
  });
  const now = Date.now();
  const checks: [string, SignInFailurePolicy][] = [
    [keys.perClient, SIGN_IN_FAILURE_POLICIES.perClient],
    [keys.perAccount, SIGN_IN_FAILURE_POLICIES.perAccount],
  ];
  let retryAfter: number | null = null;
  for (const [key, policy] of checks) {
    const row = rows.find((candidate) => candidate.key === key);
    const counter: FailureCounter | null = row
      ? { count: row.count, windowStartedAt: Number(row.lastRequest) }
      : null;
    if (counter && isSignInBlocked(counter, policy, now)) {
      retryAfter = Math.max(retryAfter ?? 0, retryAfterSeconds(counter, policy, now));
    }
  }
  return retryAfter;
}

export async function recordSignInAttempt(
  email: string,
  clientAddress: string | null,
  status: number,
): Promise<void> {
  const result = classifySignInAttempt(status);
  if (result === 'NOT_COUNTED') return;
  const keys = signInThrottleKeys(email, clientAddress, fingerprint);
  if (result === 'SUCCEEDED') {
    await prisma.rateLimit.deleteMany({ where: { key: keys.perClient } });
    return;
  }
  const now = Date.now();
  await recordFailure(keys.perClient, SIGN_IN_FAILURE_POLICIES.perClient, now);
  await recordFailure(keys.perAccount, SIGN_IN_FAILURE_POLICIES.perAccount, now);
}
