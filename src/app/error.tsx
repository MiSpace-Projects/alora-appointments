'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './status.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  return (
    <main className={styles.page}>
      <p className={styles.code}>Oops</p>
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.body}>
        An unexpected error interrupted this page. You can try again, or head back home.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={reset} className={styles.primary}>
          Try again
        </button>
        <Link href="/" className={styles.secondary}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
