import type { Variants } from 'framer-motion';

/**
 * Shared framer-motion primitives so easing and entrance patterns are defined
 * once. Individual components compose these instead of redeclaring the curve
 * and stagger/fade variants.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Parent that fades in and staggers its children. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

/** Child that fades up into place. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};
