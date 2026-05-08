"use client";

import { motion } from "framer-motion";
import styles from "./Hero.module.css";

const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.18,
    },
  },
};

const textBlockVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const buttonGroupVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: 0.2 },
  },
};

const statsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.3,
    },
  },
};

const statItemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const scrollIndicatorVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut", delay: 0.6 },
  },
};

const scrollDotAnimation = {
  y: [0, 10, 0],
  opacity: [1, 0.6, 1],
  transition: {
    duration: 1.8,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

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
            <span>Alora</span>
          </h1>
          <div className={styles.label}>Premium Beauty and Hair Services</div>
          <p className={styles.description}>
            Wig care, nails, makeup &amp; matric farewell looks — crafted with precision. Earn loyalty rewards with every visit.
          </p>
        </motion.div>

        <motion.div className={styles.actions} variants={buttonGroupVariants}>
          <a href="/BookNow" className={styles.primaryButton}>
            Book Now
          </a>
          <a href="/services" className={styles.secondaryButton}>
            Our Services
          </a>
        </motion.div>

        <motion.div className={styles.stats} variants={statsContainerVariants}>
          <motion.div className={styles.statItem} variants={statItemVariants}>
            <div className={styles.statValue}>50+</div>
            <div className={styles.statLabel}>Clients</div>
          </motion.div>
          <motion.div className={styles.statItem} variants={statItemVariants}>
            <div className={styles.statValue}>4.9★</div>
            <div className={styles.statLabel}>Rating</div>
          </motion.div>
          <motion.div className={styles.statItem} variants={statItemVariants}>
            <div className={styles.statValue}>10+</div>
            <div className={styles.statLabel}>Bookings</div>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.scrollIndicator}
        variants={scrollIndicatorVariants}
      >
        <div className={styles.scrollTrack}>
          <motion.span
            className={styles.scrollDot}
            animate={scrollDotAnimation}
          />
        </div>
      </motion.div>
    </motion.section>
  );
}
