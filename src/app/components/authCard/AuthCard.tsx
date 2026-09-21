'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import styles from './AuthCard.module.css';

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`${styles.authCard} ${className || ''}`}
    >
      {children}
    </motion.div>
  );
}

export function AuthHeader() {
  return (
    <div className={styles.header}>
      <div className={styles.brand}>
        <Image
          src="/alora-hair.png"
          alt="Alora"
          className={styles.logoSmall}
          width={32}
          height={32}
        />
        <span className={styles.brandName}>Alora Appointments</span>
      </div>
    </div>
  );
}
