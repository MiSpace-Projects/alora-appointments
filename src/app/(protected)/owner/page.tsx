import type { Metadata } from 'next';
import type { BookingStatus } from '@prisma/client';
import { requireOwner } from '@/lib/owner';
import { listAllBookings } from '@/lib/data/bookings';
import { pointsLiabilityCents } from '@/lib/data/rewards';
import { formatDateTime, formatZar } from '@/lib/format';
import {
  confirmBookingAction,
  completeBookingAction,
  cancelBookingAction,
  refreshCatalogAction,
} from './actions';
import { OwnerTabs } from './OwnerTabs';
import styles from './owner.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bookings', robots: { index: false, follow: false } };

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export default async function OwnerBookingsPage() {
  await requireOwner();
  const [bookings, liabilityCents] = await Promise.all([listAllBookings(), pointsLiabilityCents()]);
  const pending = bookings.filter((booking) => booking.status === 'PENDING').length;

  return (
    <main className={styles.page}>
      <OwnerTabs active="bookings" />
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Bookings</h1>
          <p className={styles.subtitle}>
            {bookings.length === 0
              ? 'No bookings yet.'
              : `${bookings.length} booking${bookings.length === 1 ? '' : 's'} · ${pending} awaiting confirmation`}
          </p>
          <p className={styles.subtitle}>
            Unused customer points are worth {formatZar(liabilityCents)} in discounts.
          </p>
        </div>
        <form action={refreshCatalogAction}>
          <button type="submit" className={styles.refresh}>
            Refresh catalog
          </button>
        </form>
      </header>

      {bookings.length === 0 ? (
        <p className={styles.empty}>New bookings will appear here as customers make them.</p>
      ) : (
        <ul className={styles.list}>
          {bookings.map((booking) => {
            const payment = booking.payments[0];
            return (
              <li key={booking.id} className={styles.row}>
                <div className={styles.main}>
                  <p className={styles.service}>{booking.service.name}</p>
                  <p className={styles.when}>{formatDateTime(booking.startsAt)}</p>
                  <p className={styles.customer}>
                    {booking.user?.name ?? 'Deleted customer'}
                    {booking.user?.email ? ` · ${booking.user.email}` : ''}
                  </p>
                  {booking.notes && <p className={styles.notes}>“{booking.notes}”</p>}
                </div>

                <div className={styles.meta}>
                  <span className={`${styles.badge} ${styles[`status_${booking.status}`]}`}>
                    {STATUS_LABEL[booking.status]}
                  </span>
                  <span className={styles.price}>
                    {formatZar(booking.priceCents - booking.discountCents)}
                  </span>
                  {booking.discountCents > 0 && (
                    <span className={styles.pay}>
                      {formatZar(booking.discountCents)} off with {booking.pointsRedeemed} points
                    </span>
                  )}
                  <span className={styles.pay}>
                    {booking.paymentMethod === 'PAY_NOW' ? 'Pay now' : 'At salon'}
                    {payment ? ` · ${payment.status.toLowerCase()}` : ''}
                  </span>
                </div>

                <div className={styles.actions}>
                  {booking.status === 'PENDING' && (
                    <form action={confirmBookingAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <button type="submit" className={styles.confirm}>
                        Confirm
                      </button>
                    </form>
                  )}
                  {booking.status === 'CONFIRMED' && (
                    <form action={completeBookingAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <button type="submit" className={styles.complete}>
                        Mark done
                      </button>
                    </form>
                  )}
                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <form action={cancelBookingAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <button type="submit" className={styles.cancel}>
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
