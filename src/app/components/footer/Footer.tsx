import styles from './Footer.module.css';
import Link from 'next/link';

const bookUrl = 'https://preview--alora-glow-studio.base44.app/book';
const dashUrl = 'https://preview--alora-glow-studio.base44.app/dashboard';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <div className={styles.logo}>Alora</div>
          <p className={styles.tagline}>
            Premium wig care, nail artistry, and matric farewell beauty services. Your glow-up
            starts here.
          </p>
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Services</span>
          <ul className={styles.links}>
            {['Wig Care', 'Nail Art', 'Matric Farewell', 'Hair Styling', 'Makeup'].map((s) => (
              <li key={s}>
                <Link href={bookUrl}>{s}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Quick Links</span>
          <ul className={styles.links}>
            <li>
              <Link href={bookUrl}>Book Appointment</Link>
            </li>
            <li>
              <Link href={dashUrl}>My Bookings</Link>
            </li>
            <li>
              <Link href={dashUrl}>Loyalty Points</Link>
            </li>
          </ul>
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Contact</span>
          <ul className={styles.links}>
            <li>
              <span>alorabookings@gmail.com</span>
            </li>
            <li>
              <span>+27(60) 639-7955</span>
            </li>
            <li>
              <span>Bethlehem, Free State</span>
            </li>
            <li>
              <span>
                <link></link>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>© 2026 Alora Appointments. All rights reserved.</div>
    </footer>
  );
}
