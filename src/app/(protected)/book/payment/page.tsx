import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { settlePaymentByReference, type SettleOutcome } from '@/lib/data/payments';
import { routes } from '@/app/config/routes';
import styles from '../book.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Payment', robots: { index: false } };

interface PageProps {
  searchParams: Promise<{ reference?: string | string[]; trxref?: string | string[] }>;
}

const copy: Record<SettleOutcome, { title: string; body: string }> = {
  PAID: {
    title: 'Payment received',
    body: 'Your booking is confirmed. A receipt has been recorded against your appointment.',
  },
  ALREADY_PAID: {
    title: 'Already paid',
    body: 'This booking was already confirmed. Nothing more to do.',
  },
  PENDING: {
    title: 'Payment still processing',
    body: 'Your bank has not confirmed the payment yet. We will update your booking automatically as soon as it clears; check your profile in a few minutes.',
  },
  FAILED: {
    title: 'Payment did not go through',
    body: 'No money was taken. Your booking is saved as unpaid and you can try again from your profile, or pay at the salon.',
  },
  UNKNOWN_REFERENCE: {
    title: 'We could not match that payment',
    body: 'The reference does not belong to one of your bookings. If you were charged, contact us with the reference below.',
  },
};

/**
 * Paystack sends the customer back here after checkout. The outcome is
 * decided by verifying the reference with Paystack server-side, never by
 * anything in the URL; the webhook performs the same idempotent settlement.
 */
export default async function PaymentReturnPage({ searchParams }: PageProps) {
  const session = await requireSession();

  const params = await searchParams;
  const raw = params.reference ?? params.trxref;
  const reference = Array.isArray(raw) ? raw[0] : raw;

  let outcome: SettleOutcome = 'UNKNOWN_REFERENCE';
  if (reference) {
    // Ownership: only settle references that belong to this user's bookings.
    const owned = await prisma.payment.findFirst({
      where: { reference, userId: session.user.id },
      select: { id: true },
    });
    if (owned) {
      try {
        outcome = await settlePaymentByReference(reference);
      } catch {
        outcome = 'PENDING';
      }
    }
  }

  const { title, body } = copy[outcome];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{body}</p>
        {reference && (
          <p className={styles.reference}>
            Reference <code>{reference}</code>
          </p>
        )}
        <div className={styles.actions}>
          {reference && (outcome === 'PAID' || outcome === 'ALREADY_PAID') && (
            <Link
              href={`/book/payment/receipt/${encodeURIComponent(reference)}`}
              className={styles.primaryLink}
            >
              View receipt
            </Link>
          )}
          <Link
            href={routes.myProfile.path}
            className={
              reference && (outcome === 'PAID' || outcome === 'ALREADY_PAID')
                ? styles.secondaryLink
                : styles.primaryLink
            }
          >
            Go to my bookings
          </Link>
          {outcome === 'FAILED' && (
            <Link href={routes.bookNow.path} className={styles.secondaryLink}>
              Book again
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
