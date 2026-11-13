import 'server-only';
import type { Payment, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  buildPaymentReference,
  initializeTransaction,
  refundTransaction,
  verifyTransaction,
  type VerifiedTransaction,
} from '@/lib/payments/paystack';
import { quoteRefund, type RefundQuote } from '@/lib/refund-policy';

export interface StartPaymentResult {
  authorizationUrl: string;
  reference: string;
}

export async function startBookingPayment(
  userId: string,
  userEmail: string,
  bookingId: string,
  callbackUrl: string,
): Promise<StartPaymentResult> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
    throw new Error('BOOKING_NOT_PAYABLE');
  }
  if (booking.paidAt || booking.payments.some((p) => p.status === 'SUCCESS')) {
    throw new Error('BOOKING_ALREADY_PAID');
  }

  const reusable = booking.payments.find(
    (p) =>
      p.status === 'PENDING' &&
      p.authorizationUrl &&
      Date.now() - p.createdAt.getTime() < 30 * 60_000,
  );
  if (reusable?.authorizationUrl) {
    return { authorizationUrl: reusable.authorizationUrl, reference: reusable.reference };
  }

  const reference = buildPaymentReference(booking.id);
  const init = await initializeTransaction({
    email: userEmail,
    amountCents: booking.priceCents,
    reference,
    callbackUrl,
    metadata: { bookingId: booking.id, userId },
  });

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId,
        reference: init.reference,
        amountCents: booking.priceCents,
        authorizationUrl: init.authorizationUrl,
        status: 'PENDING',
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { paymentMethod: 'PAY_NOW' },
    }),
  ]);

  return { authorizationUrl: init.authorizationUrl, reference: init.reference };
}

export type SettleOutcome = 'PAID' | 'ALREADY_PAID' | 'FAILED' | 'PENDING' | 'UNKNOWN_REFERENCE';

export async function settlePaymentByReference(reference: string): Promise<SettleOutcome> {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return 'UNKNOWN_REFERENCE';
  if (payment.status === 'SUCCESS') return 'ALREADY_PAID';

  const verified = await verifyTransaction(reference);
  return applyVerifiedTransaction(payment, verified);
}

async function applyVerifiedTransaction(
  payment: Payment,
  verified: VerifiedTransaction,
): Promise<SettleOutcome> {
  const now = new Date();

  if (verified.status !== 'success') {
    const failed = verified.status === 'failed' || verified.status === 'abandoned';
    if (failed) {
      await prisma.payment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: {
          status: 'FAILED',
          failureReason: verified.gateway_response ?? verified.status,
          lastEventAt: now,
        },
      });
      return 'FAILED';
    }
    return 'PENDING';
  }

  const amountMatches =
    verified.amount === payment.amountCents && verified.currency.toUpperCase() === 'ZAR';
  if (!amountMatches) {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: {
        status: 'FAILED',
        failureReason: `Amount mismatch: expected ${payment.amountCents} ZAR, got ${verified.amount} ${verified.currency}`,
        lastEventAt: now,
      },
    });
    return 'FAILED';
  }

  const paidAt = verified.paid_at ? new Date(verified.paid_at) : now;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: {
        status: 'SUCCESS',
        channel: verified.channel ?? null,
        providerId: verified.id != null ? String(verified.id) : null,
        paidAt,
        lastEventAt: now,
      },
    });
    if (updated.count === 0) return 'ALREADY_PAID' as const;

    await tx.booking.updateMany({
      where: { id: payment.bookingId, status: { in: ['PENDING', 'CONFIRMED'] } },
      data: { status: 'CONFIRMED', paidAt, paymentMethod: 'PAY_NOW' },
    });
    return 'PAID' as const;
  });

  return result;
}

export interface CancelWithRefundResult {
  quote: RefundQuote;
  refundStatus: 'NOT_NEEDED' | 'REQUESTED' | 'FAILED';
}

export async function cancelBookingWithRefund(
  userId: string,
  bookingId: string,
): Promise<CancelWithRefundResult> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId, status: { in: ['PENDING', 'CONFIRMED'] } },
    include: { payments: { where: { status: 'SUCCESS' } } },
  });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');

  const paid = booking.payments[0] ?? null;
  const quote = quoteRefund({
    paidCents: paid ? paid.amountCents - paid.refundedCents : 0,
    startsAt: booking.startsAt,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  if (!paid || quote.refundCents === 0) {
    return { quote, refundStatus: 'NOT_NEEDED' };
  }

  try {
    const refund = await refundTransaction(paid.reference, quote.refundCents);
    const refundedCents = paid.refundedCents + quote.refundCents;
    const status: PaymentStatus =
      refundedCents >= paid.amountCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    await prisma.payment.update({
      where: { id: paid.id },
      data: {
        refundedCents,
        status,
        refundReference: refund.refundId,
        lastEventAt: new Date(),
      },
    });
    return { quote, refundStatus: 'REQUESTED' };
  } catch (error) {
    await prisma.payment.update({
      where: { id: paid.id },
      data: {
        failureReason: `Refund of ${quote.refundCents} failed: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
        lastEventAt: new Date(),
      },
    });
    return { quote, refundStatus: 'FAILED' };
  }
}

export async function getRefundQuoteForBooking(
  userId: string,
  bookingId: string,
): Promise<RefundQuote | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId, status: { in: ['PENDING', 'CONFIRMED'] } },
    include: { payments: { where: { status: 'SUCCESS' } } },
  });
  if (!booking) return null;
  const paid = booking.payments[0];
  return quoteRefund({
    paidCents: paid ? paid.amountCents - paid.refundedCents : 0,
    startsAt: booking.startsAt,
  });
}

export async function recordProviderRefund(input: {
  transactionReference: string;
  amountCents: number;
  status: string;
}): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { reference: input.transactionReference },
  });
  if (!payment) return;
  if (input.status !== 'processed') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { lastEventAt: new Date() },
    });
    return;
  }
  const refundedCents = Math.min(
    payment.amountCents,
    Math.max(payment.refundedCents, input.amountCents),
  );
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      refundedCents,
      status: refundedCents >= payment.amountCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      lastEventAt: new Date(),
    },
  });
}
