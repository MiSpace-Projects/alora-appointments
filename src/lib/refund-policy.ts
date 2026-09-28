import { cancellationPolicy } from '@/app/config/business';

export type RefundTier = 'FULL' | 'PARTIAL' | 'NONE';

export interface RefundQuote {
  tier: RefundTier;
  refundCents: number;
  retainedCents: number;
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
