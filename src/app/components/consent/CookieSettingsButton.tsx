'use client';

import { useConsent } from './ConsentContext';
import styles from './CookieNotice.module.css';

/** Reopens the cookie notice so a visitor can review their acknowledgement (cookie policy page, footer). */
export function CookieSettingsButton() {
  const { openNotice } = useConsent();
  return (
    <button type="button" className={styles.secondary} onClick={openNotice}>
      Cookie settings
    </button>
  );
}
