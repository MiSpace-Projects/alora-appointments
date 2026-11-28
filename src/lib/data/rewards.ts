import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { BOOKING_LOCK_KEY } from './locks';
import {
  arePointsExpired,
  pointsExpireAt,
  pointsValueCents,
  tierForSpend,
  tierWindowStart,
  type TierStanding,
} from '@/lib/rewards-core';

type Db = Prisma.TransactionClient | typeof prisma;

export interface RewardsStanding extends TierStanding {
  points: number;
  valueCents: number;
  pointsExpireAt: Date | null;
}

export async function pointsBalance(db: Db, userId: string): Promise<number> {
  const result = await db.pointsTransaction.aggregate({
    where: { userId },
    _sum: { delta: true },
  });
  return Math.max(0, result._sum.delta ?? 0);
}

export async function spendInTierWindow(
  db: Db,
  userId: string,
  now: Date,
  excludeBookingId?: string,
): Promise<number> {
  const bookings = await db.booking.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      startsAt: { gte: tierWindowStart(now), lte: now },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { priceCents: true, discountCents: true },
  });
  return bookings.reduce((sum, booking) => sum + booking.priceCents - booking.discountCents, 0);
}

async function lastVisitAt(db: Db, userId: string): Promise<Date | null> {
  const last = await db.booking.findFirst({
    where: { userId, status: 'COMPLETED' },
    orderBy: { startsAt: 'desc' },
    select: { startsAt: true },
  });
  return last?.startsAt ?? null;
}

export async function getRewardsStanding(
  userId: string,
  now: Date = new Date(),
): Promise<RewardsStanding> {
  const [points, spend, lastVisit] = await Promise.all([
    pointsBalance(prisma, userId),
    spendInTierWindow(prisma, userId, now),
    lastVisitAt(prisma, userId),
  ]);
  return {
    ...tierForSpend(spend),
    points,
    valueCents: pointsValueCents(points),
    pointsExpireAt: points > 0 && lastVisit ? pointsExpireAt(lastVisit) : null,
  };
}

export async function returnRedeemedPoints(bookingId: string): Promise<number> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { userId: true, pointsRedeemed: true, status: true },
  });
  if (!booking?.userId || booking.pointsRedeemed <= 0 || booking.status !== 'CANCELLED') return 0;
  try {
    await prisma.pointsTransaction.create({
      data: {
        userId: booking.userId,
        bookingId,
        delta: booking.pointsRedeemed,
        reason: 'REDEMPTION_REVERSED',
      },
    });
    return booking.pointsRedeemed;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return 0;
    throw error;
  }
}

export async function expireDormantPoints(now: Date = new Date()): Promise<number> {
  const holders = await prisma.pointsTransaction.groupBy({
    by: ['userId'],
    _sum: { delta: true },
    having: { delta: { _sum: { gt: 0 } } },
  });
  let expired = 0;
  for (const holder of holders) {
    const visit = await lastVisitAt(prisma, holder.userId);
    if (!arePointsExpired(visit, now)) continue;
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOKING_LOCK_KEY})`;
      const balance = await pointsBalance(tx, holder.userId);
      if (balance <= 0) return;
      await tx.pointsTransaction.create({
        data: { userId: holder.userId, delta: -balance, reason: 'EXPIRED' },
      });
      expired += balance;
    });
  }
  return expired;
}

export async function pointsLiabilityCents(): Promise<number> {
  const result = await prisma.pointsTransaction.aggregate({ _sum: { delta: true } });
  return pointsValueCents(Math.max(0, result._sum.delta ?? 0));
}
