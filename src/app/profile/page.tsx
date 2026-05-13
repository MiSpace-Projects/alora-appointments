'use client';

import styles from './page.module.css';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

type Booking = {
  id: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  price: string;
  points: number;
};

const upcomingBookings: Booking[] = [
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

const pastBookings: Booking[] = [];

const TIER_MAX = 500;
const USER_POINTS = 35;
const TIER = 'Bronze';
const USER_NAME = 'Mzwakhe';

const statusClass: Record<Booking['status'], string> = {
  pending: styles.statusPending,
  confirmed: styles.statusConfirmed,
  cancelled: styles.statusCancelled,
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const bookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;
  const progress = Math.min((USER_POINTS / TIER_MAX) * 100, 100);

  return (
    <motion.div className={styles.page} initial="hidden" animate="show" variants={container}>
      <motion.div className={styles.welcome} variants={item}>
        <p className={styles.welcomeLabel}>Welcome back</p>
        <h1 className={styles.welcomeName}>
          {USER_NAME}
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
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <p className={styles.progressMeta}>
              {USER_POINTS} pts — {TIER_MAX - USER_POINTS} pts to next tier
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
          <Link
            href="https://preview--alora-glow-studio.base44.app/book"
            className={styles.ctaButton}
          >
            Book Now →
          </Link>
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
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'past'}
            className={`${styles.tab}${activeTab === 'past' ? ` ${styles.active}` : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past ({pastBookings.length})
          </button>
        </div>

        <div className={styles.bookingsList} role="tabpanel">
          {bookings.length === 0 ? (
            <p className={styles.emptyState}>No {activeTab} bookings.</p>
          ) : (
            bookings.map((b) => (
              <motion.div
                key={b.id}
                className={styles.bookingCard}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeOut }}
              >
                <div className={styles.bookingLeft}>
                  <p className={styles.bookingService}>{b.service}</p>
                  <p className={styles.bookingMeta}>
                    {b.date} · {b.time}
                  </p>
                </div>

                <div className={styles.bookingRight}>
                  <span className={`${styles.statusBadge} ${statusClass[b.status]}`}>
                    {b.status}
                  </span>
                  <p className={styles.bookingPrice}>{b.price}</p>
                  <p className={styles.bookingPoints}>+{b.points} loyalty points earned</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
