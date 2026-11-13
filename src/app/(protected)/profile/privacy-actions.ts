'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fingerprint, getConfiguredClientAddress } from '@/lib/security-events';
import { legalVersions } from '@/app/config/business';

export type PrivacyActionResult = { ok: true } | { ok: false; error: string };

export async function setMarketingOptInAction(optIn: boolean): Promise<PrivacyActionResult> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const ipAddress = getConfiguredClientAddress(requestHeaders);

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { marketingOptIn: optIn },
      }),
      prisma.consentRecord.create({
        data: {
          userId: session.user.id,
          kind: 'MARKETING',
          version: legalVersions.privacy,
          granted: optIn,
          ipHash: ipAddress ? fingerprint(ipAddress) : null,
          userAgent: requestHeaders.get('user-agent')?.slice(0, 512) ?? null,
        },
      }),
    ]);
    revalidatePath('/profile');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not update your preference. Please try again.' };
  }
}
