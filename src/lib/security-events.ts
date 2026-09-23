import { createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { authRuntimeConfig } from './auth-config';
import { prisma } from './prisma';

export interface SecurityEventInput {
  event: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'INFO';
  userId?: string | null;
  actor?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

function hmac(value: string): string {
  const secret = authRuntimeConfig.fingerprintSecret;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_FINGERPRINT_SECRET is required in production');
  }
  return createHmac('sha256', secret || 'alora-development-fingerprint')
    .update(value)
    .digest('base64url');
}

export function fingerprint(value: string): string {
  return hmac(value.trim().toLowerCase());
}

export function getConfiguredClientAddress(headers: Headers): string | null {
  for (const name of authRuntimeConfig.ipAddressHeaders) {
    const value = headers.get(name);
    if (value && !value.includes(',')) return value.trim().slice(0, 512);
  }
  return process.env.NODE_ENV === 'production' ? null : '127.0.0.1';
}

export async function recordSecurityEvent(input: SecurityEventInput): Promise<boolean> {
  try {
    await prisma.securityEvent.create({
      data: {
        event: input.event,
        outcome: input.outcome,
        userId: input.userId ?? null,
        actorHash: input.actor ? fingerprint(input.actor) : null,
        ipHash: input.ipAddress ? fingerprint(input.ipAddress) : null,
        userAgent: input.userAgent?.slice(0, 512) ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    return true;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'auth-audit',
        event: 'SECURITY_EVENT_PERSIST_FAILED',
        eventType: input.event,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }),
    );
    return false;
  }
}

export async function registerKnownDevice({
  userId,
  ipAddress,
  userAgent,
}: {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<boolean> {
  const deviceFingerprint = fingerprint(`${userAgent ?? 'unknown'}|${ipAddress ?? 'unknown'}`);

  try {
    await prisma.authDevice.create({
      data: {
        userId,
        fingerprint: deviceFingerprint,
        userAgent: userAgent?.slice(0, 512) ?? null,
        ipHash: ipAddress ? fingerprint(ipAddress) : null,
      },
    });
    return true;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }
    await prisma.authDevice.update({
      where: { userId_fingerprint: { userId, fingerprint: deviceFingerprint } },
      data: {
        lastSeenAt: new Date(),
        userAgent: userAgent?.slice(0, 512) ?? null,
        ipHash: ipAddress ? fingerprint(ipAddress) : null,
      },
    });
    return false;
  }
}
