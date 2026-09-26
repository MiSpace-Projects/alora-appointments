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
import {
  getPaymentProvider,
  isMockReference,
  MOCK_REFERENCE_PREFIX,
} from '@/lib/payments/provider';
/** How long after a successful payment the return page still greets it as fresh. */
const FRESH_PAYMENT_WINDOW_MS = 15 * 60_000;
/** How long a pending checkout URL may be reused before a fresh one is created. */
const REUSABLE_PAYMENT_WINDOW_MS = 30 * 60_000;

/**
 * Payment DAL. Every mutation is idempotent on the provider reference so the
 * callback page and the webhook can both run (in any order, more than once)
 * without double-confirming a booking or double-refunding.
 */

export interface StartPaymentResult {
  authorizationUrl: string;
  reference: string;
}

/**
 * Create a PENDING payment row for the acting user's own booking and obtain a
 * Paystack checkout URL. Reuses an existing pending attempt's URL when there
 * is one (customer closed the tab and came back) rather than creating a
 * second transaction for the same booking.
 */
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
      Date.now() - p.createdAt.getTime() < REUSABLE_PAYMENT_WINDOW_MS,
  );
  if (reusable?.authorizationUrl) {
    return { authorizationUrl: reusable.authorizationUrl, reference: reusable.reference };
  }

  const provider = getPaymentProvider();
  if (!provider) throw new Error('PAYMENTS_UNAVAILABLE');

  let init: { authorizationUrl: string; reference: string };
  if (provider === 'mock') {
    // Fake hosted checkout inside this app. Relative URL so it stays on the
    // origin the customer is actually on (localhost in dev, the deployed
    // domain otherwise) — never a hardcoded origin.
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

export type SettleOutcome = 'PAID' | 'ALREADY_PAID' | 'FAILED' | 'PENDING' | 'UNKNOWN_REFERENCE';

/**
 * Verify a reference with Paystack and apply the result. Safe to call from
 * both the return page and the webhook: a SUCCESS row is never rewritten, and
 * the booking is confirmed exactly once. Amount/currency are checked against
 * what we asked for so a tampered or short payment can never confirm a booking.
 */
export async function settlePaymentByReference(reference: string): Promise<SettleOutcome> {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return 'UNKNOWN_REFERENCE';
  if (payment.status === 'SUCCESS') {
    // The webhook often settles before the customer lands on the return
    // page; greet a just-completed payment as PAID rather than "already".
    const fresh =
      payment.paidAt != null && Date.now() - payment.paidAt.getTime() < FRESH_PAYMENT_WINDOW_MS;
    return fresh ? 'PAID' : 'ALREADY_PAID';
  }
  if (isMockReference(reference)) {
    // Mock payments are settled explicitly by the fake checkout page.
    return payment.status === 'FAILED' ? 'FAILED' : 'PENDING';
  }

  const verified = await verifyTransaction(reference);
  return applyVerifiedTransaction(payment, verified);
}

/**
 * Mock provider only: the fake checkout page reports the outcome the tester
 * chose. Runs through the same state machine as a verified Paystack result.
 */
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

  // Conditional update on PENDING makes the transition exactly-once under
  // concurrent callback + webhook delivery.
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

/**
 * Cancel the acting user's booking and, if it was paid online, request the
 * policy-determined refund from Paystack. The booking is cancelled first
 * (customer intent is honoured even if the provider call fails); a failed
 * refund is flagged for manual follow-up rather than silently dropped.
 */
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
    const refund = isMockReference(paid.reference)
      ? {
          status: 'processed',
          amountCents: quote.refundCents,
          refundId: `mock_refund_${Date.now()}`,
        }
      : await refundTransaction(paid.reference, quote.refundCents);
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

/** Refund quote for the cancel confirmation dialog (read-only, ownership enforced). */
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

/**
 * Record a refund event from the provider (webhook). Reconciles the ledger
 * when a refund was initiated from the Paystack dashboard rather than by us.
 */
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

/**
 * Receipt for one of the acting user's own payments. Ownership is enforced in
 * the query, and only a settled (or refunded) payment yields a receipt.
 */
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

/** True when the reference belongs to one of this user's payments (ownership guard). */
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

/** Minimal payment + service data for the checkout page; ownership enforced. */
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
