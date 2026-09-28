import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { getCurrentSession, type CurrentSession } from './session';
import { isOwnerEmail, parseOwnerAllowlist } from './owner-core';

function ownerAllowlist(): string[] {
  return parseOwnerAllowlist(process.env.ALORA_OWNER_EMAILS);
}

export function isOwnerSession(session: CurrentSession | null): boolean {
  if (!session) return false;
  return isOwnerEmail(session.user.email, ownerAllowlist());
}

export async function isCurrentUserOwner(): Promise<boolean> {
  return isOwnerSession(await getCurrentSession());
}

export async function requireOwner(): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (!isOwnerSession(session)) notFound();
  return session;
}
