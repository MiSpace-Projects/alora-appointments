'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './Hero.module.css';
import {
  heroVariants,
  textBlockVariants,
  buttonGroupVariants,
  statsContainerVariants,
  statItemVariants,
  scrollIndicatorVariants,
  scrollDotAnimation,
} from './heroAnimations';
import { heroCopy, heroActions, heroStats } from './heroData';

export default function Hero() {
  return (
    <motion.section
      className={styles.hero}
      initial="hidden"
      animate="visible"
      variants={heroVariants}
    >
      <motion.div className={styles.content} variants={textBlockVariants}>
        <motion.div className={styles.textGroup} variants={textBlockVariants}>
          <h1 className={styles.title}>
            <span>{heroCopy.title}</span>
          </h1>
          <div className={styles.label}>{heroCopy.label}</div>
          <p className={styles.description}>{heroCopy.description}</p>
        </motion.div>

        <motion.div className={styles.actions} variants={buttonGroupVariants}>
          {heroActions.map((action) => (
            <Link key={action.href} href={action.href} className={styles[action.variant]}>
              {action.label}
            </Link>
          ))}
        </motion.div>

        <motion.div className={styles.stats} variants={statsContainerVariants}>
          {heroStats.map((stat) => (
            <motion.div key={stat.label} className={styles.statItem} variants={statItemVariants}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div className={styles.scrollIndicator} variants={scrollIndicatorVariants}>
        <div className={styles.scrollTrack}>
          <motion.span className={styles.scrollDot} animate={scrollDotAnimation} />
        </div>
      </motion.div>
    </motion.section>
  );
}
