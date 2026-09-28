'use client';

import styles from './receipt.module.css';

export function PrintButton() {
  return (
    <button type="button" className={styles.printButton} onClick={() => window.print()}>
      Print / save PDF
    </button>
  );
}
