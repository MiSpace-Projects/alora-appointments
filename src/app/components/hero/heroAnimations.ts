import type { Variants } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';

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
    transition: { duration: 0.75, ease: EASE_OUT },
  },
};

export const visualVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.85, ease: EASE_OUT },
  },
};
