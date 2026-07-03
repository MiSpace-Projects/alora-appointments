import styles from './status.module.css';

export default function Loading() {
  return (
    <main className={styles.page}>
      <span className={styles.spinner} role="status" aria-label="Loading" />
    </main>
  );
}
