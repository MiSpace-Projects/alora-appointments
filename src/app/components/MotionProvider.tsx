'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Wraps the app in a single MotionConfig so every framer-motion animation
 * honours the user's `prefers-reduced-motion` setting automatically. This is
 * the one-line, app-wide way to satisfy WCAG 2.3.3 instead of patching each
 * animated component — motion-sensitive users get transforms reduced globally.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
