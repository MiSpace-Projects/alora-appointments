import 'server-only';
import { prisma } from '@/lib/prisma';
import { computeBalance, standingForPoints, type LoyaltyStanding } from '@/lib/loyalty-core';

/**
 * Loyalty reads. Balance is always derived from the append-only ledger
 * (never a stored field), so it can't drift from the transaction history.
 */
export async function getUserLoyalty(userId: string): Promise<LoyaltyStanding> {
  const entries = await prisma.pointsTransaction.findMany({
    where: { userId },
    select: { delta: true },
  });
  return standingForPoints(computeBalance(entries));
}
