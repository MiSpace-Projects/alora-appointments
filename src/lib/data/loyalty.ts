import 'server-only';
import { prisma } from '@/lib/prisma';
import { computeBalance, standingForPoints, type LoyaltyStanding } from '@/lib/loyalty-core';

export async function getUserLoyalty(userId: string): Promise<LoyaltyStanding> {
  const entries = await prisma.pointsTransaction.findMany({
    where: { userId },
    select: { delta: true },
  });
  return standingForPoints(computeBalance(entries));
}
