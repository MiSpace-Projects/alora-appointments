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

/**
 * Append one consent event. Never updates or deletes: withdrawing consent is a
 * new row with `granted: false`, so the trail always shows what a person agreed
 * to, which version, and when (POPIA accountability, s11(1)(a), s69).
 */
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

/** Latest decision per consent kind for a user (null when never recorded). */
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

/**
 * Consent rows written when an account is created: terms and privacy notice
 * (mandatory, versioned) and the marketing decision (opt-in only, recorded
 * either way so an opt-out is provable too). Best-effort: sign-up must not
 * fail because the audit write did.
 */
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
