'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { recordConsent } from '@/lib/data/consent';
import { getConfiguredClientAddress } from '@/lib/security-events';
import { CONSENT_VERSION } from '@/lib/consent';

/**
 * Persist the cookie-notice acknowledgement for a signed-in user. Anonymous
 * visitors are covered by the consent cookie alone; there is no account to
 * attach a record to and we deliberately do not fingerprint them for this.
 * Failures are swallowed: the notice must never block the site.
 */
export async function acknowledgeCookieNoticeAction(): Promise<void> {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session) return;

    await recordConsent({
      userId: session.user.id,
      kind: 'COOKIE_NOTICE',
      version: CONSENT_VERSION,
      granted: true,
      ipAddress: getConfiguredClientAddress(requestHeaders),
      userAgent: requestHeaders.get('user-agent'),
    });
  } catch {
    // Non-critical: the cookie itself is the primary record for the visitor.
  }
}
