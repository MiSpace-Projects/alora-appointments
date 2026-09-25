import 'server-only';
import { prisma } from '@/lib/prisma';
import type { CreateBookingInput } from '@/lib/validation';

/**
 * Booking DAL. Every function is scoped to the acting `userId` and enforces
 * ownership, so a caller can only ever read or mutate their own bookings — the
 * authorization boundary lives here, not in the UI.
 */

export function listUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { startsAt: 'desc' },
    include: {
      service: { select: { name: true, slug: true } },
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

/**
 * Create a PENDING booking. Price and points are snapshotted from the service
 * at booking time so later catalog edits never rewrite a customer's history.
 * Points are NOT awarded here — they're earned when the booking is completed
 * (see completeBooking), keeping the ledger truthful.
 */
export async function createBooking(userId: string, input: CreateBookingInput) {
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, active: true },
  });
  if (!service) {
    throw new Error('SERVICE_NOT_AVAILABLE');
  }

  // Guard against the same user double-booking the same slot with a live booking.
  const clash = await prisma.booking.findFirst({
    where: {
      userId,
      startsAt: input.startsAt,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { id: true },
  });
  if (clash) {
    throw new Error('SLOT_ALREADY_BOOKED');
  }

  return prisma.booking.create({
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
  });
}

/** Cancel one of the acting user's own bookings (ownership enforced in the where). */
export async function cancelBooking(userId: string, bookingId: string) {
  const result = await prisma.booking.updateMany({
    where: { id: bookingId, userId, status: { in: ['PENDING', 'CONFIRMED'] } },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  if (result.count === 0) {
    throw new Error('BOOKING_NOT_FOUND');
  }
}

/**
 * Mark a booking COMPLETED and award its snapshotted points as a single ledger
 * entry — atomically, so a booking can never be completed without the matching
 * points row (or vice versa). Staff/admin action: gate behind a role check once
 * roles exist (tracked).
 */
export async function completeBooking(bookingId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new Error('BOOKING_NOT_COMPLETABLE');
    }

    await tx.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });

    // A booking whose account has since been deleted has no wallet to credit.
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
