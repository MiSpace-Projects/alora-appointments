'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatZar } from '@/lib/format';
import { describeRefundTier, type RefundQuote } from '@/lib/refund-policy';
import { startPaymentAction } from '../book/actions';
import { cancelBookingAction, getRefundQuoteAction } from './booking-actions';
import styles from './page.module.css';

interface BookingActionsProps {
  bookingId: string;
  /** Show the "Pay now" control (unpaid, upcoming, gateway configured). */
  canPay: boolean;
  /** Show the "Cancel" control (upcoming and live). */
  canCancel: boolean;
}

/**
 * Per-booking controls: resume/retry online payment, and cancel with a refund
 * preview. The preview is fetched from the server so what the customer sees
 * is exactly what the cancel action will apply.
 */
export function BookingActions({ bookingId, canPay, canCancel }: BookingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quote, setQuote] = useState<RefundQuote | null>(null);

  const pay = () => {
    startTransition(async () => {
      const result = await startPaymentAction(bookingId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.redirectUrl) {
        toast.message('Taking you to secure payment…');
        window.location.assign(result.redirectUrl);
      }
    });
  };

  const askToCancel = () => {
    startTransition(async () => {
      const result = await getRefundQuoteAction(bookingId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setQuote(result.quote);
    });
  };

  const confirmCancel = () => {
    startTransition(async () => {
      const result = await cancelBookingAction(bookingId);
      setQuote(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.refundStatus === 'REQUESTED') {
        toast.success(
          `Booking cancelled. Refund of ${formatZar(result.quote.refundCents)} requested.`,
        );
      } else if (result.refundStatus === 'FAILED') {
        toast.warning(
          'Booking cancelled, but the refund could not be started automatically. We will process it manually and email you.',
        );
      } else {
        toast.success('Booking cancelled.');
      }
      router.refresh();
    });
  };

  if (!canPay && !canCancel) return null;

  return (
    <div className={styles.bookingActions}>
      {quote ? (
        <div className={styles.cancelConfirm} role="alertdialog" aria-live="polite">
          <p className={styles.cancelConfirmTitle}>Cancel this booking?</p>
          <p className={styles.cancelConfirmBody}>
            {quote.refundCents > 0
              ? `${describeRefundTier(quote.tier)} You will be refunded ${formatZar(
                  quote.refundCents,
                )}${quote.retainedCents > 0 ? `; ${formatZar(quote.retainedCents)} is retained` : ''}.`
              : quote.retainedCents > 0
                ? `${describeRefundTier(quote.tier)} The amount paid is not refundable.`
                : 'Nothing was paid online, so there is nothing to refund.'}
          </p>
          <div className={styles.bookingActionRow}>
            <button
              type="button"
              className={styles.dangerAction}
              disabled={isPending}
              onClick={confirmCancel}
            >
              {isPending ? 'Cancelling…' : 'Yes, cancel'}
            </button>
            <button
              type="button"
              className={styles.quietAction}
              disabled={isPending}
              onClick={() => setQuote(null)}
            >
              Keep booking
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.bookingActionRow}>
          {canPay && (
            <button type="button" className={styles.payAction} disabled={isPending} onClick={pay}>
              {isPending ? 'Starting…' : 'Pay now'}
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              className={styles.quietAction}
              disabled={isPending}
              onClick={askToCancel}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
