import { cancellationPolicy } from '@/app/config/business';

/**
 * Pure refund maths shared by the terms page, the cancel confirmation UI and
 * the server-side cancel action, so the customer is always shown exactly what
 * the server will do. No I/O; unit-tested.
 */

export type RefundTier = 'FULL' | 'PARTIAL' | 'NONE';

export interface RefundQuote {
  tier: RefundTier;
  /** Cents to refund (0 when nothing was paid or the tier is NONE). */
  refundCents: number;
  /** Cents retained by the salon. */
  retainedCents: number;
  /** Hours between the cancellation moment and the appointment start. */
  hoursBefore: number;
}

export function quoteRefund(input: {
  paidCents: number;
  startsAt: Date;
  cancelledAt?: Date;
}): RefundQuote {
  const now = input.cancelledAt ?? new Date();
  const hoursBefore = (input.startsAt.getTime() - now.getTime()) / 3_600_000;
  const paid = Math.max(0, Math.floor(input.paidCents));

  if (paid === 0) {
    return { tier: 'NONE', refundCents: 0, retainedCents: 0, hoursBefore };
  }
  // Appointment already started or passed: treated as a no-show.
  if (hoursBefore <= 0) {
    return { tier: 'NONE', refundCents: 0, retainedCents: paid, hoursBefore };
  }
  if (hoursBefore >= cancellationPolicy.fullRefundHours) {
    return { tier: 'FULL', refundCents: paid, retainedCents: 0, hoursBefore };
  }
  const refundCents = Math.round(paid * cancellationPolicy.lateRefundFraction);
  return { tier: 'PARTIAL', refundCents, retainedCents: paid - refundCents, hoursBefore };
}

export function describeRefundTier(tier: RefundTier): string {
  switch (tier) {
    case 'FULL':
      return `Cancelled ${cancellationPolicy.fullRefundHours}h or more before: full refund.`;
    case 'PARTIAL':
      return `Cancelled inside ${cancellationPolicy.fullRefundHours}h: ${Math.round(
        cancellationPolicy.lateRefundFraction * 100,
      )}% refund.`;
    case 'NONE':
      return 'No refund applies.';
  }
}
