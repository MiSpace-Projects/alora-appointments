'use client';

import { MotionConfig } from 'framer-motion';

interface MotionProviderProps {
  children: React.ReactNode;
  nonce?: string;
}

export function MotionProvider({ children, nonce }: MotionProviderProps) {
  return (
    <MotionConfig reducedMotion="user" nonce={nonce}>
      {children}
    </MotionConfig>
  );
}
