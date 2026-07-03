import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

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
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}
