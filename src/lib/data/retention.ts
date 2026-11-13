import 'server-only';
import { prisma } from '@/lib/prisma';
import { retentionCutoffs } from '@/lib/retention-core';

const FINANCIAL_BATCH_SIZE = 500;

export interface RetentionSummary {
  expiredSessions: number;
  expiredVerifications: number;
  staleRateLimits: number;
  securityEvents: number;
  authDevices: number;
  orphanedBookingNotesCleared: number;
  bookings: number;
  payments: number;
}

export interface FailureCounts {
  emailFailures: number;
  refundFailures: number;
  paymentFailures: number;
}

async function purgeFinancialRecords(
  cutoff: Date,
): Promise<{ bookings: number; payments: number }> {
  const candidates = await prisma.booking.findMany({
    where: {
      createdAt: { lt: cutoff },
      startsAt: { lt: cutoff },
      AND: [
        { OR: [{ paidAt: null }, { paidAt: { lt: cutoff } }] },
        { OR: [{ cancelledAt: null }, { cancelledAt: { lt: cutoff } }] },
      ],
      payments: {
        none: {
          OR: [
            { createdAt: { gte: cutoff } },
            { updatedAt: { gte: cutoff } },
            { paidAt: { gte: cutoff } },
            { lastEventAt: { gte: cutoff } },
          ],
        },
      },
    },
    select: { id: true },
    take: FINANCIAL_BATCH_SIZE,
  });
  if (candidates.length === 0) return { bookings: 0, payments: 0 };

  const ids = candidates.map((candidate) => candidate.id);
  const [payments, bookings] = await prisma.$transaction([
    prisma.payment.deleteMany({ where: { bookingId: { in: ids } } }),
    prisma.booking.deleteMany({ where: { id: { in: ids } } }),
  ]);
  return { bookings: bookings.count, payments: payments.count };
}

export async function purgeExpiredData(now: Date): Promise<RetentionSummary> {
  const cutoffs = retentionCutoffs(now);

  const expiredSessions = await prisma.session.deleteMany({
    where: { expiresAt: { lt: cutoffs.expiredBefore } },
  });
  const expiredVerifications = await prisma.verification.deleteMany({
    where: { expiresAt: { lt: cutoffs.expiredBefore } },
  });
  const staleRateLimits = await prisma.rateLimit.deleteMany({
    where: { lastRequest: { lt: cutoffs.rateLimitBefore } },
  });
  const securityEvents = await prisma.securityEvent.deleteMany({
    where: { createdAt: { lt: cutoffs.securityLogsBefore } },
  });
  const authDevices = await prisma.authDevice.deleteMany({
    where: { lastSeenAt: { lt: cutoffs.securityLogsBefore } },
  });
  const orphanedNotes = await prisma.booking.updateMany({
    where: { userId: null, notes: { not: null } },
    data: { notes: null },
  });
  const financial = await purgeFinancialRecords(cutoffs.financialRecordsBefore);

  return {
    expiredSessions: expiredSessions.count,
    expiredVerifications: expiredVerifications.count,
    staleRateLimits: staleRateLimits.count,
    securityEvents: securityEvents.count,
    authDevices: authDevices.count,
    orphanedBookingNotesCleared: orphanedNotes.count,
    bookings: financial.bookings,
    payments: financial.payments,
  };
}

export async function countRecentFailures(since: Date): Promise<FailureCounts> {
  const [emailFailures, refundFailures, paymentFailures] = await Promise.all([
    prisma.securityEvent.count({
      where: { event: 'EMAIL_DISPATCHED', outcome: 'FAILURE', createdAt: { gte: since } },
    }),
    prisma.securityEvent.count({
      where: { event: 'REFUND_FAILED', outcome: 'FAILURE', createdAt: { gte: since } },
    }),
    prisma.payment.count({
      where: {
        status: 'FAILED',
        OR: [{ lastEventAt: { gte: since } }, { lastEventAt: null, updatedAt: { gte: since } }],
      },
    }),
  ]);
  return { emailFailures, refundFailures, paymentFailures };
}
