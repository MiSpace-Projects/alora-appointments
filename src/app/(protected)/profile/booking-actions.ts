'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentSession } from '@/lib/session';
import { cancelBookingWithRefund, getRefundQuoteForBooking } from '@/lib/data/payments';
import type { RefundQuote } from '@/lib/refund-policy';

export type RefundQuoteResult = { ok: true; quote: RefundQuote } | { ok: false; error: string };

export type CancelResult =
  | { ok: true; quote: RefundQuote; refundStatus: 'NOT_NEEDED' | 'REQUESTED' | 'FAILED' }
  | { ok: false; error: string };

/** Refund preview shown before the customer confirms a cancellation (ECTA s43(2) spirit: no surprises). */
export async function getRefundQuoteAction(bookingId: unknown): Promise<RefundQuoteResult> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: 'You must be signed in.' };
  if (typeof bookingId !== 'string') return { ok: false, error: 'Booking not found.' };

  const quote = await getRefundQuoteForBooking(session.user.id, bookingId);
  if (!quote) return { ok: false, error: 'That booking cannot be cancelled.' };
  return { ok: true, quote };
}

/** Cancel one of the user's own bookings and refund per policy if it was paid online. */
export async function cancelBookingAction(bookingId: unknown): Promise<CancelResult> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: 'You must be signed in.' };
  if (typeof bookingId !== 'string') return { ok: false, error: 'Booking not found.' };

  try {
    const result = await cancelBookingWithRefund(session.user.id, bookingId);
    revalidatePath('/profile');
    return { ok: true, ...result };
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN';
    return {
      ok: false,
      error:
        code === 'BOOKING_NOT_FOUND'
          ? 'That booking cannot be cancelled.'
          : 'Could not cancel the booking. Please try again.',
    };
  }
}
