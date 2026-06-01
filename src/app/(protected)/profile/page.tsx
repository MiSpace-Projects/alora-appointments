'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRequireAuth } from '../../contexts/AuthContext';
import ProtectedLink from '../../components/protected/ProtectedLink';
import styles from './page.module.css';

const easeOut = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

type Booking = {
  id: string;
  service: string;
  date: string;
  time: string;
  status: BookingStatus;
  price: string;
  points: number;
};

const UPCOMING_BOOKINGS: Booking[] = [
  {
    id: '1',
    service: 'Wig Wash & Style',
    date: '28 May 2026',
    time: '09:30',
    status: 'pending',
    price: 'R350',
    points: 35,
  },
];

const PAST_BOOKINGS: Booking[] = [];

const USER_POINTS = 35;
const POINTS_TO_NEXT = 500;
const TIER = 'Bronze';

const statusClass: Record<BookingStatus, string> = {
  pending: styles.statusPending,
  confirmed: styles.statusConfirmed,
  cancelled: styles.statusCancelled,
};

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getFirstName(name?: string | null): string {
  if (!name) return 'there';
  return name.split(' ')[0];
}

export default function ProfilePage() {
  const { user, loading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  if (loading || !user) return null;

  const bookings = activeTab === 'upcoming' ? UPCOMING_BOOKINGS : PAST_BOOKINGS;
  const progressPercent = Math.min((USER_POINTS / POINTS_TO_NEXT) * 100, 100);

  return (
    <motion.div className={styles.page} initial="hidden" animate="show" variants={container}>
      <motion.div className={styles.welcome} variants={item}>
        <p className={styles.welcomeLabel}>Welcome back</p>
        <h1 className={styles.welcomeName}>
          {getFirstName(user.name)}
          <i className={styles.star}>✦</i>
        </h1>
      </motion.div>

      <motion.div className={styles.grid} variants={item}>
        <div className={`${styles.card} ${styles.loyaltyCard}`}>
          <div className={styles.loyaltyTop}>
            <div>
              <p className={styles.loyaltyLabel}>Loyalty Status</p>
              <p className={styles.tierName}>{TIER}</p>
            </div>
            <div className={styles.pointsBadge}>
              <span className={styles.pointsNumber}>{USER_POINTS}</span>
              <span className={styles.pointsLabel}>points earned</span>
            </div>
          </div>
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>
            <p className={styles.progressMeta}>
              {USER_POINTS} pts — {POINTS_TO_NEXT - USER_POINTS} pts to next tier
            </p>
          </div>
        </div>

        <div className={`${styles.card} ${styles.ctaCard}`}>
          <div>
            <p className={styles.loyaltyLabel}>Ready for your next visit?</p>
            <h2 className={styles.ctaCardTitle}>Book New Appointment</h2>
            <p className={styles.ctaCardSub}>
              Choose from our premium services and keep earning points.
            </p>
          </div>
          <ProtectedLink
            href="https://preview--alora-glow-studio.base44.app/book"
            className={styles.ctaButton}
          >
            Book Now →
          </ProtectedLink>
        </div>
      </motion.div>

      <motion.div className={styles.accountStrip} variants={item}>
        <div className={styles.accountAvatar}>{getInitials(user.name)}</div>
        <div>
          <p className={styles.accountName}>{user.name}</p>
          <p className={styles.accountEmail}>{user.email}</p>
        </div>
      </motion.div>

      <motion.div className={styles.bookingsSection} variants={item}>
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            className={`${styles.tab}${activeTab === 'upcoming' ? ` ${styles.active}` : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({UPCOMING_BOOKINGS.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'past'}
            className={`${styles.tab}${activeTab === 'past' ? ` ${styles.active}` : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past ({PAST_BOOKINGS.length})
          </button>
        </div>

        <div className={styles.bookingsList} role="tabpanel">
          {bookings.length === 0 ? (
            <p className={styles.emptyState}>No {activeTab} bookings.</p>
          ) : (
            bookings.map((booking) => (
              <motion.div
                key={booking.id}
                className={styles.bookingCard}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeOut }}
              >
                <div className={styles.bookingLeft}>
                  <p className={styles.bookingService}>{booking.service}</p>
                  <p className={styles.bookingMeta}>
                    {booking.date} · {booking.time}
                  </p>
                </div>
                <div className={styles.bookingRight}>
                  <span className={`${styles.statusBadge} ${statusClass[booking.status]}`}>
                    {booking.status}
                  </span>
                  <p className={styles.bookingPrice}>{booking.price}</p>
                  <p className={styles.bookingPoints}>+{booking.points} loyalty points</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
