'use client';

import styles from './DynamicBanner.module.css';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '@/lib/motion';
import { FiArrowUpRight } from 'react-icons/fi';
import ProtectedLink from '../protected/ProtectedLink';

interface DynamicBannerProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function DynamicBanner({
  kicker,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  className,
  style,
}: DynamicBannerProps) {
  return (
    <motion.section
      className={`${styles.banner}${className ? ` ${className}` : ''}`}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={staggerContainer}
    >
      {kicker && (
        <motion.span className={styles.kicker} variants={fadeUpItem}>
          {kicker}
        </motion.span>
      )}
      <motion.h2 className={styles.title} variants={fadeUpItem}>
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p className={styles.subtitle} variants={fadeUpItem}>
          {subtitle}
        </motion.p>
      )}
      {ctaLabel && ctaHref && (
        <motion.div variants={fadeUpItem}>
          <ProtectedLink href={ctaHref} className={styles.cta}>
            {ctaLabel}
            <FiArrowUpRight />
          </ProtectedLink>
        </motion.div>
      )}
    </motion.section>
  );
}
