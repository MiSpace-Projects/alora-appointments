import 'server-only';
import type { ConsentKind } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { fingerprint } from '@/lib/security-events';
import { legalVersions } from '@/app/config/business';

export interface RecordConsentInput {
  userId: string | null;
  kind: ConsentKind;
  version: string;
  granted: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function recordConsent(input: RecordConsentInput) {
  return prisma.consentRecord.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      version: input.version,
      granted: input.granted,
      ipHash: input.ipAddress ? fingerprint(input.ipAddress) : null,
      userAgent: input.userAgent?.slice(0, 512) ?? null,
    },
  });
}

export async function getLatestConsent(userId: string, kind: ConsentKind) {
  return prisma.consentRecord.findFirst({
    where: { userId, kind },
    orderBy: { createdAt: 'desc' },
  });
}

interface SignUpConsentInput {
  userId: string;
  marketingOptIn: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordSignUpConsents(input: SignUpConsentInput): Promise<void> {
  const base = {
    userId: input.userId,
    ipHash: input.ipAddress ? fingerprint(input.ipAddress) : null,
    userAgent: input.userAgent?.slice(0, 512) ?? null,
  };
  try {
    await prisma.consentRecord.createMany({
      data: [
        { ...base, kind: 'TERMS', version: legalVersions.terms, granted: true },
        { ...base, kind: 'PRIVACY_NOTICE', version: legalVersions.privacy, granted: true },
        {
          ...base,
          kind: 'MARKETING',
          version: legalVersions.privacy,
          granted: input.marketingOptIn,
        },
      ],
    });
  } catch (error) {
    console.error('[consent] failed to record sign-up consents', error);
  }
}

export interface SetMarketingConsentInput {
  userId: string;
  optIn: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function setMarketingConsent(input: SetMarketingConsentInput): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: { marketingOptIn: input.optIn },
    }),
    prisma.consentRecord.create({
      data: {
        userId: input.userId,
        kind: 'MARKETING',
        version: legalVersions.privacy,
        granted: input.optIn,
        ipHash: input.ipAddress ? fingerprint(input.ipAddress) : null,
        userAgent: input.userAgent?.slice(0, 512) ?? null,
      },
    }),
  ]);
}
