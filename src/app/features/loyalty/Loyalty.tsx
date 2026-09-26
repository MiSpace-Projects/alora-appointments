'use client';

import Image from 'next/image';
import styles from './Loyalty.module.css';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '@/lib/motion';
import { CiStar, CiTrophy, CiGift } from 'react-icons/ci';
import { LuCrown } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import ProtectedLink from '@/app/components/protected/ProtectedLink';
import { routes } from '@/app/config/routes';

const tiers: {
  level: string;
  name: string;
  range: string;
  detail: string;
  icon: IconType;
}[] = [
  {
    level: '01',
    name: 'Bronze',
    range: '0 – 499 pts',
    detail: 'Earn 10 pts per booking',
    icon: CiStar,
  },
  {
    level: '02',
    name: 'Silver',
    range: '500 – 999 pts',
    detail: '5% off every 5th visit',
    icon: CiGift,
  },
  {
    level: '03',
    name: 'Gold',
    range: '1 000 – 1 999 pts',
    detail: '10% off + add-on',
    icon: CiTrophy,
  },
  {
    level: '04',
    name: 'Platinum',
    range: '2 000+ pts',
    detail: '15% off + priority booking',
    icon: LuCrown,
  },
];

export default function LoyaltyPage() {
  return (
    <div className={styles.page}>
      <motion.section
        className={styles.intro}
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        <div className={styles.header}>
          <motion.span className={styles.kicker} variants={fadeUpItem}>
            Rewards
          </motion.span>

          <motion.h1 className={styles.title} variants={fadeUpItem}>
            Loyalty
            <br />
            Programme
          </motion.h1>

          <motion.p className={styles.subtitle} variants={fadeUpItem}>
            Every visit earns points. Climb the tiers and unlock exclusive perks.
          </motion.p>
        </div>

        {/* Theme-matched portrait: light-background shot in light mode, dark in dark,
            so the photo's own backdrop dissolves into the section. */}
        <motion.div className={styles.portrait} variants={fadeUpItem} aria-hidden="true">
          <Image
            src="/features/face-art.webp"
            alt=""
            fill
            sizes="(max-width: 900px) 0px, 26vw"
            className={`${styles.portraitImg} ${styles.portraitLight}`}
          />
          <Image
            src="/features/raised-arm.webp"
            alt=""
            fill
            sizes="(max-width: 900px) 0px, 26vw"
            className={`${styles.portraitImg} ${styles.portraitDark}`}
          />
        </motion.div>
      </motion.section>

      <motion.section
        className={styles.grid}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <motion.div key={tier.level} className={styles.card} variants={fadeUpItem}>
              <div className={styles.cardLeft}>
                <div className={styles.icon}>
                  <Icon size={22} />
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.tier}>{tier.name}</div>
                <div className={styles.points}>{tier.range}</div>
                <div className={styles.detail}>{tier.detail}</div>
              </div>

              <div className={styles.level}>{tier.level}</div>
            </motion.div>
          );
        })}
      </motion.section>

      <motion.div
        className={styles.ctaWrap}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUpItem}
      >
        <ProtectedLink href={routes.bookNow.path} className={styles.cta}>
          Start Earning Points →
        </ProtectedLink>
      </motion.div>
    </div>
  );
}
