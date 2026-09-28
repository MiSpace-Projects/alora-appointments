'use client';

import { useConsent } from './ConsentContext';
import styles from './CookieNotice.module.css';

export function CookieSettingsButton() {
  const { openNotice } = useConsent();
  return (
    <button type="button" className={styles.secondary} onClick={openNotice}>
      Cookie settings
    </button>
  );
}
