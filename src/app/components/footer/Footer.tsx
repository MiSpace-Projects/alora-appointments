import Link from 'next/link';
import { routes } from '@/app/config/routes';
import { businessContact } from '@/app/config/business';
import { serviceFamilies } from '@/app/features/servicesSection/servicesData';
import ProtectedLink from '../protected/ProtectedLink';
import styles from './Footer.module.css';

const legalLinks = [routes.privacy, routes.cookies, routes.terms, routes.paia] as const;

export default function Footer() {
  const year = new Date().getFullYear();

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
            {serviceFamilies.map((family) => (
              <li key={family.slug}>
                <Link href={`${routes.servicesIndex.path}/${family.slug}`}>{family.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Quick Links</span>
          <ul className={styles.links}>
            <li>
              <ProtectedLink href={routes.bookNow.path}>Book Appointment</ProtectedLink>
            </li>
            <li>
              <ProtectedLink href={routes.myProfile.path}>My Bookings</ProtectedLink>
            </li>
            <li>
              <ProtectedLink href={routes.myProfile.path}>Loyalty Points</ProtectedLink>
            </li>
          </ul>
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Contact</span>
          <ul className={styles.links}>
            <li>
              <a href={`mailto:${businessContact.email}`}>{businessContact.email}</a>
            </li>
            <li>
              <a href={`tel:${businessContact.phoneE164}`}>{businessContact.phoneDisplay}</a>
            </li>
            <li>
              <span>{businessContact.location}</span>
            </li>
          </ul>
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Legal</span>
          <ul className={styles.links}>
            {legalLinks.map((route) => (
              <li key={route.path}>
                <Link href={route.path}>{route.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        © {year} {businessContact.tradingName}. All rights reserved.
      </div>
    </footer>
  );
}
