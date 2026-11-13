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
import { recordSecurityEvent } from '@/lib/security-events';
import {
  notifyCustomerBookingCancelled,
  notifyCustomerBookingConfirmed,
} from '@/lib/notifications';
import { formatDateTime, formatZar } from '@/lib/format';
import {
  getPaymentProvider,
  isMockReference,
  MOCK_REFERENCE_PREFIX,
} from '@/lib/payments/provider';
const FRESH_PAYMENT_WINDOW_MS = 15 * 60_000;
const REUSABLE_PAYMENT_WINDOW_MS = 30 * 60_000;

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
    include: {
      payments: { orderBy: { createdAt: 'desc' } },
      service: { select: { priceType: true } },
    },
  });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
    throw new Error('BOOKING_NOT_PAYABLE');
  }
  if (booking.service.priceType !== 'FIXED') {
    throw new Error('ONLINE_PAYMENT_NOT_ALLOWED');
  }
  if (booking.startsAt.getTime() <= Date.now()) {
    throw new Error('BOOKING_NOT_PAYABLE');
  }
  if (booking.paidAt || booking.payments.some((p) => p.status === 'SUCCESS')) {
    throw new Error('BOOKING_ALREADY_PAID');
  }

  const reusable = booking.payments.find(
    (p) =>
      p.status === 'PENDING' &&
      p.authorizationUrl &&
      Date.now() - p.createdAt.getTime() < REUSABLE_PAYMENT_WINDOW_MS,
  );
  if (reusable?.authorizationUrl) {
    return { authorizationUrl: reusable.authorizationUrl, reference: reusable.reference };
  }

  const provider = getPaymentProvider();
  if (!provider) throw new Error('PAYMENTS_UNAVAILABLE');

  let init: { authorizationUrl: string; reference: string };
  if (provider === 'mock') {
    const reference = `${MOCK_REFERENCE_PREFIX}${booking.id}_${Date.now().toString(36)}`;
    init = {
      reference,
      authorizationUrl: `/book/payment/mock?reference=${encodeURIComponent(reference)}`,
    };
  } else {
    const reference = buildPaymentReference(booking.id);
    init = await initializeTransaction({
      email: userEmail,
      amountCents: booking.priceCents,
      reference,
      callbackUrl,
      metadata: { bookingId: booking.id, userId },
    });
  }

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

export type SettleOutcome =
  | 'PAID'
  | 'ALREADY_PAID'
  | 'FAILED'
  | 'PENDING'
  | 'REFUNDED'
  | 'UNKNOWN_REFERENCE';

export async function settlePaymentByReference(reference: string): Promise<SettleOutcome> {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return 'UNKNOWN_REFERENCE';
  if (payment.status === 'SUCCESS') {
    const fresh =
      payment.paidAt != null && Date.now() - payment.paidAt.getTime() < FRESH_PAYMENT_WINDOW_MS;
    return fresh ? 'PAID' : 'ALREADY_PAID';
  }
  if (isMockReference(reference)) {
    return payment.status === 'FAILED' ? 'FAILED' : 'PENDING';
  }

  const verified = await verifyTransaction(reference);
  return applyVerifiedTransaction(payment, verified);
}

export async function settleMockPayment(
  reference: string,
  outcome: 'success' | 'failed',
): Promise<SettleOutcome> {
  if (!isMockReference(reference)) return 'UNKNOWN_REFERENCE';
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return 'UNKNOWN_REFERENCE';
  if (payment.status === 'SUCCESS') return 'ALREADY_PAID';
  return applyVerifiedTransaction(payment, {
    status: outcome,
    reference,
    amount: payment.amountCents,
    currency: 'ZAR',
    channel: 'mock',
    paid_at: new Date().toISOString(),
    gateway_response: outcome === 'success' ? 'Approved (mock)' : 'Declined (mock)',
  });
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

    const alreadyPaid = await tx.payment.count({
      where: {
        bookingId: payment.bookingId,
        id: { not: payment.id },
        status: { in: ['SUCCESS', 'PARTIALLY_REFUNDED'] },
      },
    });
    if (alreadyPaid > 0) return 'DUPLICATE' as const;

    const confirmed = await tx.booking.updateMany({
      where: { id: payment.bookingId, status: { in: ['PENDING', 'CONFIRMED'] } },
      data: { status: 'CONFIRMED', paidAt, paymentMethod: 'PAY_NOW' },
    });
    if (confirmed.count === 0) return 'BOOKING_CLOSED' as const;
    return 'PAID' as const;
  });

  if (result === 'DUPLICATE' || result === 'BOOKING_CLOSED') {
    const paid = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    await requestRefund(paid, paid.amountCents, result);
    return 'REFUNDED';
  }

  if (result === 'PAID') {
    await sendBookingConfirmation(payment.bookingId);
  }
  return result;
}

type RefundOutcome = 'NOT_NEEDED' | 'IN_PROGRESS' | 'REQUESTED' | 'PROCESSED' | 'FAILED';

export function refundableCents(
  payment: Pick<Payment, 'amountCents' | 'refundedCents' | 'pendingRefundCents'>,
): number {
  return Math.max(0, payment.amountCents - payment.refundedCents - payment.pendingRefundCents);
}

async function requestRefund(
  payment: Payment,
  amountCents: number,
  reason: string,
): Promise<RefundOutcome> {
  const amount = Math.min(amountCents, refundableCents(payment));
  if (amount <= 0) return 'NOT_NEEDED';

  const reserved = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      pendingRefundCents: 0,
      refundedCents: payment.refundedCents,
      status: { in: ['SUCCESS', 'PARTIALLY_REFUNDED'] },
    },
    data: { pendingRefundCents: amount, lastEventAt: new Date() },
  });
  if (reserved.count === 0) return 'IN_PROGRESS';

  try {
    const refund = isMockReference(payment.reference)
      ? { status: 'processed', amountCents: amount, refundId: `mock_refund_${Date.now()}` }
      : await refundTransaction(payment.reference, amount);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { refundReference: refund.refundId, lastEventAt: new Date() },
    });
    if (refund.status === 'processed') {
      await applyProcessedRefund(payment.id, amount);
      return 'PROCESSED';
    }
    return 'REQUESTED';
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        pendingRefundCents: 0,
        failureReason: `Refund of ${amount} failed: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
        lastEventAt: new Date(),
      },
    });
    await recordSecurityEvent({
      event: 'REFUND_FAILED',
      outcome: 'FAILURE',
      metadata: { reference: payment.reference, amountCents: amount, reason },
    });
    return 'FAILED';
  }
}

async function applyProcessedRefund(paymentId: string, processedCents: number): Promise<boolean> {
  const updated = await prisma.$executeRaw`
    UPDATE "payment"
    SET "refundedCents" = LEAST("amountCents", "refundedCents" + ${processedCents}),
        "pendingRefundCents" = "pendingRefundCents" - ${processedCents},
        "status" = (CASE
          WHEN LEAST("amountCents", "refundedCents" + ${processedCents}) >= "amountCents"
            THEN 'REFUNDED'
          ELSE 'PARTIALLY_REFUNDED'
        END)::"PaymentStatus",
        "lastEventAt" = NOW(),
        "updatedAt" = NOW()
    WHERE "id" = ${paymentId} AND "pendingRefundCents" >= ${processedCents} AND ${processedCents} > 0`;
  return updated > 0;
}

function toCancelRefundStatus(outcome: RefundOutcome): CancelWithRefundResult['refundStatus'] {
  if (outcome === 'FAILED') return 'FAILED';
  if (outcome === 'NOT_NEEDED') return 'NOT_NEEDED';
  return 'REQUESTED';
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
    include: { payments: { where: { status: { in: ['SUCCESS', 'PARTIALLY_REFUNDED'] } } } },
  });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');

  const claimed = await prisma.booking.updateMany({
    where: { id: bookingId, userId, status: { in: ['PENDING', 'CONFIRMED'] } },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  if (claimed.count === 0) throw new Error('BOOKING_NOT_FOUND');

  const paid = booking.payments[0] ?? null;
  const quote = quoteRefund({
    paidCents: paid ? refundableCents(paid) : 0,
    startsAt: booking.startsAt,
  });

  const refundStatus =
    paid && quote.refundCents > 0
      ? toCancelRefundStatus(await requestRefund(paid, quote.refundCents, 'CUSTOMER_CANCELLED'))
      : 'NOT_NEEDED';

  await sendBookingCancellation(
    bookingId,
    'customer',
    paid && quote.refundCents > 0 ? quote.refundCents : 0,
  );
  return { quote, refundStatus };
}

export interface OwnerCancelResult {
  refundedCents: number;
  refundStatus: CancelWithRefundResult['refundStatus'];
}

export async function cancelBookingAsOwnerWithRefund(
  bookingId: string,
): Promise<OwnerCancelResult> {
  const claimed = await prisma.booking.updateMany({
    where: { id: bookingId, status: { in: ['PENDING', 'CONFIRMED'] } },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  if (claimed.count === 0) throw new Error('BOOKING_NOT_FOUND');

  const payments = await prisma.payment.findMany({
    where: { bookingId, status: { in: ['SUCCESS', 'PARTIALLY_REFUNDED'] } },
  });

  let refundedCents = 0;
  let refundStatus: CancelWithRefundResult['refundStatus'] = 'NOT_NEEDED';
  for (const payment of payments) {
    const amount = refundableCents(payment);
    if (amount <= 0) continue;
    const outcome = await requestRefund(payment, amount, 'SALON_CANCELLED');
    if (outcome === 'FAILED') refundStatus = 'FAILED';
    else if (outcome !== 'NOT_NEEDED') {
      refundedCents += amount;
      if (refundStatus !== 'FAILED') refundStatus = 'REQUESTED';
    }
  }

  await sendBookingCancellation(bookingId, 'salon', refundedCents);
  return { refundedCents, refundStatus };
}

export async function getRefundQuoteForBooking(
  userId: string,
  bookingId: string,
): Promise<RefundQuote | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId, status: { in: ['PENDING', 'CONFIRMED'] } },
    include: { payments: { where: { status: { in: ['SUCCESS', 'PARTIALLY_REFUNDED'] } } } },
  });
  if (!booking) return null;
  const paid = booking.payments[0];
  return quoteRefund({
    paidCents: paid ? refundableCents(paid) : 0,
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

  if (input.status === 'processed') {
    if (payment.pendingRefundCents > 0) {
      await applyProcessedRefund(
        payment.id,
        Math.min(input.amountCents, payment.pendingRefundCents),
      );
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
    return;
  }

  if (input.status === 'failed') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        pendingRefundCents: 0,
        failureReason: `Refund of ${input.amountCents} failed at the provider`,
        lastEventAt: new Date(),
      },
    });
    await recordSecurityEvent({
      event: 'REFUND_FAILED',
      outcome: 'FAILURE',
      metadata: { reference: payment.reference, amountCents: input.amountCents },
    });
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { lastEventAt: new Date() },
  });
}

async function bookingContact(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      startsAt: true,
      service: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

async function sendBookingConfirmation(bookingId: string): Promise<void> {
  try {
    const booking = await bookingContact(bookingId);
    if (!booking?.user?.email) return;
    await notifyCustomerBookingConfirmed(booking.user.email, {
      customerName: booking.user.name ?? '',
      serviceName: booking.service.name,
      when: formatDateTime(booking.startsAt),
    });
  } catch (error) {
    console.error(
      '[payments] confirmation email failed:',
      error instanceof Error ? error.message : error,
    );
  }
}

async function sendBookingCancellation(
  bookingId: string,
  cancelledBy: 'customer' | 'salon',
  refundCents: number,
): Promise<void> {
  try {
    const booking = await bookingContact(bookingId);
    if (!booking?.user?.email) return;
    await notifyCustomerBookingCancelled(booking.user.email, {
      customerName: booking.user.name ?? '',
      serviceName: booking.service.name,
      when: formatDateTime(booking.startsAt),
      cancelledBy,
      refund: refundCents > 0 ? formatZar(refundCents) : null,
    });
  } catch (error) {
    console.error(
      '[payments] cancellation email failed:',
      error instanceof Error ? error.message : error,
    );
  }
}

export interface ReceiptData {
  reference: string;
  status: PaymentStatus;
  amountCents: number;
  refundedCents: number;
  currency: string;
  channel: string | null;
  paidAt: Date | null;
  createdAt: Date;
  serviceName: string;
  startsAt: Date;
  customerName: string;
  customerEmail: string;
}

export async function getReceiptByReference(
  userId: string,
  reference: string,
  customer: { name: string; email: string },
): Promise<ReceiptData | null> {
  const payment = await prisma.payment.findFirst({
    where: { reference, userId },
    include: { booking: { include: { service: { select: { name: true } } } } },
  });
  if (!payment) return null;
  if (payment.status === 'PENDING' || payment.status === 'FAILED') return null;

  return {
    reference: payment.reference,
    status: payment.status,
    amountCents: payment.amountCents,
    refundedCents: payment.refundedCents,
    currency: payment.currency,
    channel: payment.channel,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    serviceName: payment.booking.service.name,
    startsAt: payment.booking.startsAt,
    customerName: customer.name,
    customerEmail: customer.email,
  };
}

export async function isPaymentOwnedByUser(userId: string, reference: string): Promise<boolean> {
  const owned = await prisma.payment.findFirst({
    where: { reference, userId },
    select: { id: true },
  });
  return owned !== null;
}

export interface CheckoutPaymentView {
  reference: string;
  amountCents: number;
  serviceName: string;
}

export async function getOwnedCheckoutPayment(
  userId: string,
  reference: string,
): Promise<CheckoutPaymentView | null> {
  const payment = await prisma.payment.findFirst({
    where: { reference, userId },
    select: {
      reference: true,
      amountCents: true,
      booking: { select: { service: { select: { name: true } } } },
    },
  });
  if (!payment) return null;
  return {
    reference: payment.reference,
    amountCents: payment.amountCents,
    serviceName: payment.booking.service.name,
  };
}
