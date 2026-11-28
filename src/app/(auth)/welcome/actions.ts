'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { acceptTermsForUser } from '@/lib/data/consent';
import { sanitizeRedirect } from '@/lib/safe-redirect';
import { getConfiguredClientAddress } from '@/lib/security-events';
import { getCurrentSession } from '@/lib/session';

export interface WelcomeFormState {
  error?: string;
}

export async function acceptTermsAction(
  next: string,
  _previous: WelcomeFormState,
  formData: FormData,
): Promise<WelcomeFormState> {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (formData.get('termsAccepted') !== 'on') {
    return { error: 'Please accept the terms and privacy policy to continue.' };
  }
  const requestHeaders = await headers();
  await acceptTermsForUser({
    userId: session.user.id,
    marketingOptIn: formData.get('marketingOptIn') === 'on',
    ipAddress: getConfiguredClientAddress(requestHeaders),
    userAgent: requestHeaders.get('user-agent'),
  });
  redirect(sanitizeRedirect(next));
}
