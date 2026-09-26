import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAuthenticatedEntryRedirect } from '@/lib/auth-entry-redirect';

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const destination = getAuthenticatedEntryRedirect(requestHeaders.get('x-alora-return-to'));

  if (destination !== null) {
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (session) redirect(destination);
  }

  return <>{children}</>;
}
