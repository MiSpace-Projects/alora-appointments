import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { loginWithCallback, sanitizeRedirect } from '@/lib/safe-redirect';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  const returnTo = sanitizeRedirect(requestHeaders.get('x-alora-return-to'));
  if (!session) redirect(loginWithCallback(returnTo));
  if (!session.user.termsAccepted) redirect(`/welcome?next=${encodeURIComponent(returnTo)}`);

  return <>{children}</>;
}
