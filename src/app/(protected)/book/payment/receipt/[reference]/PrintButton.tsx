'use client';

import styles from './receipt.module.css';

/** Print / save-as-PDF via the browser's own print dialog (no PDF dependency). */
export function PrintButton() {
  return (
    <button type="button" className={styles.printButton} onClick={() => window.print()}>
      Print / save PDF
    </button>
  );
}
