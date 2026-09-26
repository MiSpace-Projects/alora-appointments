'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { setMarketingConsent } from '@/lib/data/consent';
import { auth } from '@/lib/auth';
import { getConfiguredClientAddress } from '@/lib/security-events';

export type PrivacyActionResult = { ok: true } | { ok: false; error: string };

/**
 * Turn marketing email on or off (POPIA s69). Writes the flag on the user and
 * appends a consent row in the same transaction, so both the grant and the
 * withdrawal are provable and never out of step with the flag.
 */
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
