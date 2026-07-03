'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LoyaltyStanding } from '@/lib/loyalty-core';
import { formatZar, formatBookingDate, formatBookingTime } from '@/lib/format';
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

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface BookingView {
  id: string;
  startsAt: Date | string;
  status: BookingStatus;
  priceCents: number;
  pointsAwarded: number;
  service: { name: string };
}

export interface ProfileUser {
  name: string;
  email: string;
}

const statusClass: Record<BookingStatus, string> = {
  PENDING: styles.statusPending,
  CONFIRMED: styles.statusConfirmed,
  CANCELLED: styles.statusCancelled,
  COMPLETED: styles.statusConfirmed,
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

// A booking is "upcoming" while it's still live and in the future; everything
// else (completed, cancelled, past) is history.
function isUpcoming(b: BookingView): boolean {
  const future = new Date(b.startsAt).getTime() > Date.now();
  return future && (b.status === 'PENDING' || b.status === 'CONFIRMED');
}

export function ProfileView({
  user,
  bookings,
  loyalty,
}: {
  user: ProfileUser;
  bookings: BookingView[];
  loyalty: LoyaltyStanding;
}) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));
  const visible = activeTab === 'upcoming' ? upcoming : past;

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
              <p className={styles.tierName}>{loyalty.tier}</p>
            </div>
            <div className={styles.pointsBadge}>
              <span className={styles.pointsNumber}>{loyalty.points}</span>
              <span className={styles.pointsLabel}>points earned</span>
            </div>
          </div>
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${loyalty.progressPercent}%` }}
              />
            </div>
            <p className={styles.progressMeta}>
              {loyalty.points} pts
              {loyalty.pointsToNext !== null && loyalty.nextTier
                ? ` — ${loyalty.pointsToNext} pts to ${loyalty.nextTier}`
                : ' — top tier reached'}
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
          <ProtectedLink href="/book" className={styles.ctaButton}>
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
            Upcoming ({upcoming.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'past'}
            className={`${styles.tab}${activeTab === 'past' ? ` ${styles.active}` : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past ({past.length})
          </button>
        </div>

        <div className={styles.bookingsList} role="tabpanel">
          {visible.length === 0 ? (
            <p className={styles.emptyState}>No {activeTab} bookings.</p>
          ) : (
            visible.map((booking) => (
              <motion.div
                key={booking.id}
                className={styles.bookingCard}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeOut }}
              >
                <div className={styles.bookingLeft}>
                  <p className={styles.bookingService}>{booking.service.name}</p>
                  <p className={styles.bookingMeta}>
                    {formatBookingDate(booking.startsAt)} · {formatBookingTime(booking.startsAt)}
                  </p>
                </div>
                <div className={styles.bookingRight}>
                  <span className={`${styles.statusBadge} ${statusClass[booking.status]}`}>
                    {booking.status.toLowerCase()}
                  </span>
                  <p className={styles.bookingPrice}>{formatZar(booking.priceCents)}</p>
                  <p className={styles.bookingPoints}>+{booking.pointsAwarded} loyalty points</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
