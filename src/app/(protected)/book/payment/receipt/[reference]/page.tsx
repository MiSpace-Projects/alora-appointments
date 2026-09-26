import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { getReceiptByReference } from '@/lib/data/payments';
import { formatZar, formatBookingDate, formatBookingTime } from '@/lib/format';
import { businessContact, businessLegal } from '@/app/config/business';
import { routes } from '@/app/config/routes';
import { PrintButton } from './PrintButton';
import styles from './receipt.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Receipt', robots: { index: false } };

interface PageProps {
  params: Promise<{ reference: string }>;
}

function formatDateTime(value: Date | null): string {
  if (!value) return '—';
  return `${formatBookingDate(value)}, ${formatBookingTime(value)}`;
}

/**
 * Payment receipt for the acting user's own transaction. A record of the sale
 * (ECTA s43(1)(m) / CPA), printable to PDF via the browser. Not a tax invoice
 * unless the business is VAT-registered — noted on the document.
 */
export default async function ReceiptPage({ params }: PageProps) {
  const session = await requireSession();

  const { reference } = await params;
  const receipt = await getReceiptByReference(session.user.id, reference, {
    name: session.user.name,
    email: session.user.email,
  });
  if (!receipt) notFound();

  const refunded = receipt.refundedCents > 0;
  const netCents = receipt.amountCents - receipt.refundedCents;
  const statusLabel =
    receipt.status === 'REFUNDED'
      ? 'Refunded'
      : receipt.status === 'PARTIALLY_REFUNDED'
        ? 'Partially refunded'
        : 'Paid';

  return (
    <main className={styles.page}>
      <article className={styles.receipt}>
        <header className={styles.head}>
          <div>
            <p className={styles.brand}>{businessContact.tradingName}</p>
            <p className={styles.brandMeta}>
              {businessContact.location}, {businessContact.country}
              <br />
              <a href={`mailto:${businessContact.email}`}>{businessContact.email}</a> ·{' '}
              <a href={`tel:${businessContact.phoneE164}`}>{businessContact.phoneDisplay}</a>
            </p>
          </div>
          <div className={styles.docLabel}>
            <span className={styles.receiptWord}>Receipt</span>
            <span
              className={`${styles.status} ${refunded ? styles.statusRefunded : styles.statusPaid}`}
            >
              {statusLabel}
            </span>
          </div>
        </header>

        <dl className={styles.meta}>
          <div>
            <dt>Receipt no.</dt>
            <dd className={styles.mono}>{receipt.reference}</dd>
          </div>
          <div>
            <dt>Date paid</dt>
            <dd>{formatDateTime(receipt.paidAt ?? receipt.createdAt)}</dd>
          </div>
          <div>
            <dt>Billed to</dt>
            <dd>
              {receipt.customerName}
              <br />
              {receipt.customerEmail}
            </dd>
          </div>
          <div>
            <dt>Payment method</dt>
            <dd>{receipt.channel ? `Online (${receipt.channel})` : 'Online'}</dd>
          </div>
        </dl>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Description</th>
              <th className={styles.right}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className={styles.itemName}>{receipt.serviceName}</span>
                <span className={styles.itemSub}>
                  Appointment · {formatDateTime(receipt.startsAt)}
                </span>
              </td>
              <td className={styles.right}>{formatZar(receipt.amountCents)}</td>
            </tr>
            {refunded && (
              <tr className={styles.refundRow}>
                <td>Refund</td>
                <td className={styles.right}>−{formatZar(receipt.refundedCents)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className={styles.totalLabel}>{refunded ? 'Net paid' : 'Total paid'}</td>
              <td className={`${styles.right} ${styles.totalValue}`}>
                {formatZar(netCents)} {receipt.currency}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className={styles.note}>
          {businessLegal.vatNumber
            ? `Tax invoice. VAT no. ${businessLegal.vatNumber}. Prices include VAT.`
            : 'This is a receipt of payment, not a tax invoice (the business is not VAT-registered).'}{' '}
          Cancellations and refunds are governed by our{' '}
          <Link href={`${routes.terms.path}#cancellations`}>Terms &amp; Booking Policy</Link>.
        </p>

        <div className={styles.actions}>
          <PrintButton />
          <Link href={routes.myProfile.path} className={styles.backLink}>
            Back to my bookings
          </Link>
        </div>
      </article>
    </main>
  );
}
