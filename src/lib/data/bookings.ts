import 'server-only';
import { prisma } from '@/lib/prisma';
import type { CreateBookingInput } from '@/lib/validation';
import { bookingRules } from '@/app/config/business';
import { countOverlapping, isWithinOpeningHours } from '@/lib/booking-rules';

const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * HOUR_MS;
const BOOKING_LOCK_KEY = 7_406_201;

export function listUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { startsAt: 'desc' },
    include: {
      service: { select: { name: true, slug: true, priceType: true } },
      payments: {
        orderBy: { createdAt: 'desc' },
        select: {
          reference: true,
          status: true,
          amountCents: true,
          refundedCents: true,
          channel: true,
        },
      },
    },
  });
}

export async function createBooking(userId: string, input: CreateBookingInput) {
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, active: true, category: { not: null } },
  });
  if (!service) {
    throw new Error('SERVICE_NOT_AVAILABLE');
  }

  if (input.paymentMethod === 'PAY_NOW' && service.priceType !== 'FIXED') {
    throw new Error('ONLINE_PAYMENT_NOT_ALLOWED');
  }

  if (!isWithinOpeningHours(input.startsAt, service.durationMinutes, bookingRules.openingHours)) {
    throw new Error('OUTSIDE_OPENING_HOURS');
  }

  const candidate = { startsAt: input.startsAt, durationMinutes: service.durationMinutes };
  const windowStart = new Date(input.startsAt.getTime() - DAY_MS);
  const windowEnd = new Date(input.startsAt.getTime() + service.durationMinutes * 60_000);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOKING_LOCK_KEY})`;

    const now = new Date();
    const [upcoming, recent, nearby] = await Promise.all([
      tx.booking.count({
        where: { userId, status: { in: ['PENDING', 'CONFIRMED'] }, startsAt: { gt: now } },
      }),
      tx.booking.count({
        where: { userId, createdAt: { gt: new Date(now.getTime() - HOUR_MS) } },
      }),
      tx.booking.findMany({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          startsAt: { gte: windowStart, lt: windowEnd },
        },
        select: { userId: true, startsAt: true, service: { select: { durationMinutes: true } } },
      }),
    ]);

    if (recent >= bookingRules.maxBookingsPerHourPerCustomer) {
      throw new Error('TOO_MANY_BOOKING_REQUESTS');
    }
    if (upcoming >= bookingRules.maxUpcomingPerCustomer) {
      throw new Error('TOO_MANY_UPCOMING_BOOKINGS');
    }

    const existing = nearby.map((booking) => ({
      userId: booking.userId,
      startsAt: booking.startsAt,
      durationMinutes: booking.service.durationMinutes,
    }));
    if (
      countOverlapping(
        candidate,
        existing.filter((b) => b.userId === userId),
      ) > 0
    ) {
      throw new Error('SLOT_ALREADY_BOOKED');
    }
    if (countOverlapping(candidate, existing) >= bookingRules.concurrentBookings) {
      throw new Error('SLOT_UNAVAILABLE');
    }

    return tx.booking.create({
      data: {
        userId,
        serviceId: service.id,
        startsAt: input.startsAt,
        priceCents: service.priceCents,
        pointsAwarded: service.pointsAwarded,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
        status: 'PENDING',
      },
      include: {
        service: { select: { name: true, priceType: true, priceMaxCents: true } },
      },
    });
  });
}

export function listAllBookings() {
  return prisma.booking.findMany({
    orderBy: { startsAt: 'desc' },
    include: {
      service: { select: { name: true } },
      user: { select: { name: true, email: true } },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true, amountCents: true, refundedCents: true },
      },
    },
  });
}

export async function confirmBooking(bookingId: string) {
  const result = await prisma.booking.updateMany({
    where: { id: bookingId, status: 'PENDING' },
    data: { status: 'CONFIRMED' },
  });
  if (result.count === 0) {
    throw new Error('BOOKING_NOT_CONFIRMABLE');
  }
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

export async function completeBooking(bookingId: string) {
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.booking.updateMany({
      where: { id: bookingId, status: { in: ['PENDING', 'CONFIRMED'] } },
      data: { status: 'COMPLETED' },
    });
    if (claimed.count === 0) {
      throw new Error('BOOKING_NOT_COMPLETABLE');
    }

    const booking = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
    if (booking.pointsAwarded > 0 && booking.userId) {
      await tx.pointsTransaction.create({
        data: {
          userId: booking.userId,
          delta: booking.pointsAwarded,
          reason: 'EARNED_BOOKING',
          bookingId: booking.id,
        },
      });
    }
  });
}
