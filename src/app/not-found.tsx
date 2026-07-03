import Link from 'next/link';
import styles from './status.module.css';

export default function NotFound() {
  return (
    <main className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.body}>
        The page you’re looking for doesn’t exist or has moved. Let’s get you back to something
        beautiful.
      </p>
      <div className={styles.actions}>
        <Link href="/" className={styles.primary}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
