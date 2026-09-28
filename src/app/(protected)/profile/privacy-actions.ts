'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { setMarketingConsent } from '@/lib/data/consent';
import { auth } from '@/lib/auth';
import { getConfiguredClientAddress } from '@/lib/security-events';

export type PrivacyActionResult = { ok: true } | { ok: false; error: string };

export async function setMarketingOptInAction(optIn: boolean): Promise<PrivacyActionResult> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const ipAddress = getConfiguredClientAddress(requestHeaders);

  try {
    await setMarketingConsent({
      userId: session.user.id,
      optIn,
      ipAddress,
      userAgent: requestHeaders.get('user-agent'),
    });
    revalidatePath('/profile');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not update your preference. Please try again.' };
  }
}
