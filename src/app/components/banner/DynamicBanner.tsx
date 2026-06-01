'use client';

import styles from './DynamicBanner.module.css';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';

const easeOut = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

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
      variants={container}
    >
      {kicker && (
        <motion.span className={styles.kicker} variants={item}>
          {kicker}
        </motion.span>
      )}
      <motion.h2 className={styles.title} variants={item}>
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p className={styles.subtitle} variants={item}>
          {subtitle}
        </motion.p>
      )}
      {ctaLabel && ctaHref && (
        <motion.div variants={item}>
          <Link href={ctaHref} className={styles.cta}>
            {ctaLabel}
            <FiArrowUpRight />
          </Link>
        </motion.div>
      )}
    </motion.section>
  );
}
