import type { Variants } from 'framer-motion';

const easeOut = [0.22, 1, 0.36, 1] as const;

export const heroVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.12,
    },
  },
};

export const textBlockVariants: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, ease: easeOut },
  },
};

export const visualVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.85, ease: easeOut },
  },
};
