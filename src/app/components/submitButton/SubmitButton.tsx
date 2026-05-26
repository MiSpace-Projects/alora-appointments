'use client';

import { HTMLMotionProps, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import styles from './SubmitButton.module.css';

interface SubmitButtonProps extends Omit<
  HTMLMotionProps<'button'>,
  'onDragStart' | 'onDragEnd' | 'onDrag'
> {
  loading?: boolean;
  children: React.ReactNode;
}

export function SubmitButton({
  loading,
  children,
  className = '',
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <motion.button
      type="submit"
      disabled={loading || disabled}
      className={`${styles.submitButton} ${className}`}
      whileHover={{ scale: loading || disabled ? 1 : 1.01 }}
      whileTap={{ scale: loading || disabled ? 1 : 0.99 }}
      {...props}
    >
      <span className={styles.buttonContent}>
        {loading && <Loader2 size={15} className={styles.spinner} />}
        {children}
      </span>
    </motion.button>
  );
}
