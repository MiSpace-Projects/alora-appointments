'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { routes } from '@/app/config/routes';
import { useConsent } from './ConsentContext';
import styles from './CookieNotice.module.css';

export function CookieNotice() {
  const { ready, noticeOpen, consent, acknowledge, closeNotice } = useConsent();
  const primaryRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (noticeOpen) primaryRef.current?.focus({ preventScroll: true });
  }, [noticeOpen]);

  if (!ready || !noticeOpen) return null;

  const alreadyAcknowledged = consent !== null;

  return (
    <div
      className={styles.notice}
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-body"
    >
      <p className={styles.kicker}>Cookies</p>
      <h2 id="cookie-notice-title" className={styles.title}>
        Only what keeps you signed in.
      </h2>
      <p id="cookie-notice-body" className={styles.body}>
        Alora sets strictly necessary cookies for sign-in, security and remembering this choice. No
        advertising or analytics cookies. Details are in the{' '}
        <Link href={routes.cookies.path}>Cookie Policy</Link> and{' '}
        <Link href={routes.privacy.path}>Privacy Policy</Link>.
      </p>
      <div className={styles.actions}>
        <button ref={primaryRef} type="button" className={styles.primary} onClick={acknowledge}>
          {alreadyAcknowledged ? 'Save' : 'Got it'}
        </button>
        {alreadyAcknowledged && (
          <button type="button" className={styles.secondary} onClick={closeNotice}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
