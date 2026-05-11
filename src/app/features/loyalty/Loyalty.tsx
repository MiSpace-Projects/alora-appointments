'use client';

import styles from './Loyalty.module.css';
import { motion } from 'framer-motion';

const easeOut = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

const tiers = [
  { level: '01', name: 'Bronze', range: '0 – 499 pts', detail: 'Earn 10 pts per booking' },
  { level: '02', name: 'Silver', range: '500 – 999 pts', detail: '5% off every 5th visit' },
  { level: '03', name: 'Gold', range: '1 000 – 1 999 pts', detail: '10% off + add-on' },
  { level: '04', name: 'Platinum', range: '2 000+ pts', detail: '15% off + priority booking' },
];

export default function LoyaltyPage() {
  return (
    <div className={styles.page}>
      <motion.section
        className={styles.header}
        initial="hidden"
        animate="show"
        variants={container}
      >
        <motion.span className={styles.kicker} variants={item}>
          Rewards
        </motion.span>

        <motion.h1 className={styles.title} variants={item}>
          Loyalty
          <br />
          Programme
        </motion.h1>

        <motion.p className={styles.subtitle} variants={item}>
          Every visit earns points. Climb the tiers and unlock exclusive perks.
        </motion.p>
      </motion.section>

      <motion.section
        className={styles.grid}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={container}
      >
        {tiers.map((tier) => (
          <motion.div key={tier.level} className={styles.card} variants={item}>
            <div className={styles.cardLeft}>
              <div className={styles.icon} />
            </div>

            <div className={styles.cardBody}>
              <div className={styles.tier}>{tier.name}</div>
              <div className={styles.points}>{tier.range}</div>
              <div className={styles.detail}>{tier.detail}</div>
            </div>

            <div className={styles.level}>{tier.level}</div>
          </motion.div>
        ))}
      </motion.section>

      <motion.div
        className={styles.ctaWrap}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={item}
      >
        <button className={styles.cta}>Start Earning Points →</button>
      </motion.div>
    </div>
  );
}
