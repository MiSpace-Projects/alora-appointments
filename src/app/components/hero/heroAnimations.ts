import type { Variants } from 'framer-motion';

const easeOut = [0.22, 1, 0.36, 1] as const;
const easeInOut = [0.65, 0, 0.35, 1] as const;

export const heroVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.18,
    },
  },
};

export const textBlockVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

export const buttonGroupVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut, delay: 0.2 },
  },
};

export const statsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.3,
    },
  },
};

export const statItemVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export const scrollIndicatorVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut, delay: 0.6 },
  },
};

export const scrollDotAnimation = {
  y: [0, 10, 0],
  opacity: [1, 0.6, 1],
  transition: {
    duration: 1.8,
    repeat: Infinity,
    ease: easeInOut,
  },
};
