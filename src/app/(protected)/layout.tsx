import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { loginWithCallback, sanitizeRedirect } from '@/lib/safe-redirect';

/**
 * The authoritative auth gate for everything under `(protected)`.
 *
 * Unlike the edge middleware (which only sniffs a cookie for fast navigation),
 * this runs on the server with database access and validates the *actual*
 * session before any protected page is rendered. If there is no valid session
 * the request never reaches the page — no flash of protected content, no
 * reliance on client-side `useRequireAuth`. Client guards remain as UX polish;
 * this is the security boundary.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    const returnTo = sanitizeRedirect(requestHeaders.get('x-alora-return-to'));
    redirect(loginWithCallback(returnTo));
  }

  return <>{children}</>;
}
