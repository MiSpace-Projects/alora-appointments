import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { fingerprint } from './security-events';

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
  '/sign-in/email': { scope: 'sign-in', max: 10, windowSeconds: 15 * 60 },
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
