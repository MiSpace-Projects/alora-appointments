'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './status.module.css';

/**
 * Root error boundary. Catches render/runtime errors in the App Router tree and
 * offers a recovery path instead of a blank screen. `reset()` re-renders the
 * segment; the Link is the escape hatch when a retry won't help.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for the log aggregator; swap console for Sentry/Datadog later.
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
