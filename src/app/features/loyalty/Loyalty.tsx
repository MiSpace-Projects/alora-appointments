'use client';

import Image from 'next/image';
import styles from './Loyalty.module.css';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '@/lib/motion';
import { Star, Gift, Crown, type LucideIcon } from 'lucide-react';
import { formatZar } from '@/lib/format';
import {
  POINT_VALUE_CENTS,
  pointsValueCents,
  REDEEM_STEP_POINTS,
  REWARD_TIERS,
  type RewardTier,
} from '@/lib/rewards-core';
import ProtectedLink from '@/app/components/protected/ProtectedLink';
import { routes } from '@/app/config/routes';

const TIER_ICONS: Record<RewardTier, LucideIcon> = { Member: Star, Silver: Gift, Gold: Crown };

const tiers = REWARD_TIERS.map((rule, index) => {
  const percentBack = (POINT_VALUE_CENTS * rule.multiplierTenths) / 100;
  return {
    level: String(index + 1).padStart(2, '0'),
    name: rule.tier,
    range:
      rule.minSpendCents === 0
        ? 'From your first visit'
        : `${formatZar(rule.minSpendCents)}+ in 12 months`,
    detail: `${rule.multiplierTenths / 10}x points · ${percentBack}% back`,
    icon: TIER_ICONS[rule.tier],
  };
});

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

          <motion.h2 className={styles.title} variants={fadeUpItem}>
            Loyalty
            <br />
            Programme
          </motion.h2>

          <motion.p className={styles.subtitle} variants={fadeUpItem}>
            Every R10 you spend earns a point. {REDEEM_STEP_POINTS} points take{' '}
            {formatZar(pointsValueCents(REDEEM_STEP_POINTS))} off a booking, and regulars earn
            faster.
          </motion.p>
        </div>

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
