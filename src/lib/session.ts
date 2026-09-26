import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';

/**
 * Session helpers — the one place the request session is read.
 *
 * `getCurrentSession` returns the session or null (for server actions that
 * report their own auth failure). `requireSession` redirects unauthenticated
 * callers to /login and narrows the type (for server components / pages and
 * form actions). Both read the incoming request headers themselves.
 */
export type CurrentSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function getCurrentSession(): Promise<CurrentSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  return session;
}
