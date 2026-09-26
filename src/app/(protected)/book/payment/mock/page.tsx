import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { formatZar } from '@/lib/format';
import { isMockPaymentsEnabled } from '@/lib/payments/provider';
import { getOwnedCheckoutPayment } from '@/lib/data/payments';
import { routes } from '@/app/config/routes';
import { completeMockPaymentAction } from './actions';
import styles from './mock.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Test checkout', robots: { index: false } };

interface PageProps {
  searchParams: Promise<{ reference?: string | string[] }>;
}

/**
 * Stand-in for Paystack's hosted checkout, for demos and local development.
 * 404s unless PAYMENTS_MOCK=true outside production. Shows exactly what the
 * customer would see on the gateway (merchant, amount, reference) and lets
 * the tester choose the outcome.
 */
export default async function MockCheckoutPage({ searchParams }: PageProps) {
  if (!isMockPaymentsEnabled()) notFound();

  const session = await requireSession();

  const params = await searchParams;
  const raw = params.reference;
  const reference = Array.isArray(raw) ? raw[0] : raw;
  if (!reference) notFound();

  const checkout = await getOwnedCheckoutPayment(session.user.id, reference);
  if (!checkout) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.merchant}>Alora Appointments</span>
          <span className={styles.badge}>Test mode</span>
        </div>

        <p className={styles.label}>Amount due</p>
        <p className={styles.amount}>{formatZar(checkout.amountCents)}</p>
        <p className={styles.meta}>
          {checkout.serviceName} · ref <code>{reference}</code>
        </p>
        <p className={styles.email}>{session.user.email}</p>

        <div className={styles.fakeCard} aria-hidden="true">
          <span>•••• •••• •••• 4242</span>
          <span>12/29</span>
        </div>

        <form action={completeMockPaymentAction} className={styles.actions}>
          <input type="hidden" name="reference" value={reference} />
          <button type="submit" name="outcome" value="success" className={styles.pay}>
            Pay {formatZar(checkout.amountCents)}
          </button>
          <button type="submit" name="outcome" value="failed" className={styles.decline}>
            Simulate a declined card
          </button>
        </form>

        <Link href={routes.myProfile.path} className={styles.cancel}>
          Cancel and return to Alora
        </Link>

        <p className={styles.note}>
          This is a simulated checkout. No card is charged. In production this page is
          Paystack&rsquo;s secure payment page.
        </p>
      </div>
    </main>
  );
}
