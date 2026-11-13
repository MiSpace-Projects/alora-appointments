import 'server-only';
import { prisma } from '@/lib/prisma';
import { hasCredentialPassword } from '@/lib/account-deletion';

export async function userHasPassword(userId: string): Promise<boolean> {
  const accounts = await prisma.account.findMany({
    where: { userId, providerId: 'credential' },
    select: { providerId: true, password: true },
  });
  return hasCredentialPassword(accounts);
}
