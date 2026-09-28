import 'server-only';
import { prisma } from '@/lib/prisma';
import type { CreateBookingInput } from '@/lib/validation';

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

export async function createBooking(userId: string, input: CreateBookingInput) {
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, active: true },
  });
  if (!service) {
    throw new Error('SERVICE_NOT_AVAILABLE');
  }

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

export async function cancelBooking(userId: string, bookingId: string) {
  const result = await prisma.booking.updateMany({
    where: { id: bookingId, userId, status: { in: ['PENDING', 'CONFIRMED'] } },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  if (result.count === 0) {
    throw new Error('BOOKING_NOT_FOUND');
  }
}

export async function completeBooking(bookingId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new Error('BOOKING_NOT_COMPLETABLE');
    }

    await tx.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });

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
