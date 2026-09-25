import { quoteRefund } from '@/lib/refund-policy';
import { cancellationPolicy } from '@/app/config/business';

const HOUR = 3_600_000;

describe('quoteRefund', () => {
  const cancelledAt = new Date('2026-10-01T10:00:00Z');

  it('refunds in full when cancelled at or beyond the full-refund window', () => {
    const startsAt = new Date(cancelledAt.getTime() + cancellationPolicy.fullRefundHours * HOUR);
    const quote = quoteRefund({ paidCents: 45000, startsAt, cancelledAt });
    expect(quote.tier).toBe('FULL');
    expect(quote.refundCents).toBe(45000);
    expect(quote.retainedCents).toBe(0);
  });

  it('refunds the late fraction inside the window', () => {
    const startsAt = new Date(cancelledAt.getTime() + 5 * HOUR);
    const quote = quoteRefund({ paidCents: 45000, startsAt, cancelledAt });
    expect(quote.tier).toBe('PARTIAL');
    expect(quote.refundCents).toBe(Math.round(45000 * cancellationPolicy.lateRefundFraction));
    expect(quote.refundCents + quote.retainedCents).toBe(45000);
  });

  it('treats a cancellation after the start time as a no-show', () => {
    const startsAt = new Date(cancelledAt.getTime() - HOUR);
    const quote = quoteRefund({ paidCents: 45000, startsAt, cancelledAt });
    expect(quote.tier).toBe('NONE');
    expect(quote.refundCents).toBe(0);
    expect(quote.retainedCents).toBe(45000);
  });

  it('never refunds anything when nothing was paid', () => {
    const startsAt = new Date(cancelledAt.getTime() + 100 * HOUR);
    const quote = quoteRefund({ paidCents: 0, startsAt, cancelledAt });
    expect(quote.tier).toBe('NONE');
    expect(quote.refundCents).toBe(0);
  });

  it('rounds partial refunds to whole cents', () => {
    const startsAt = new Date(cancelledAt.getTime() + HOUR);
    const quote = quoteRefund({ paidCents: 1, startsAt, cancelledAt });
    expect(Number.isInteger(quote.refundCents)).toBe(true);
  });
});
