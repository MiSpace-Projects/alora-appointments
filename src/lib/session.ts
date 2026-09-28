import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';

export type CurrentSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function getCurrentSession(): Promise<CurrentSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  return session;
}
