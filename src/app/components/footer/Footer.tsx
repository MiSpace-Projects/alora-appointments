import Image from 'next/image';
import Link from 'next/link';
import { routes } from '@/app/config/routes';
import { businessContact } from '@/app/config/business';
import { serviceFamilies } from '@/app/features/servicesSection/servicesData';
import ProtectedLink from '../protected/ProtectedLink';
import { BrandLogo } from '../brand/BrandLogo';
import styles from './Footer.module.css';

const legalLinks = [routes.privacy, routes.cookies, routes.terms, routes.paia] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <BrandLogo className={styles.watermark} decorative />
      <div className={styles.top}>
        <div className={styles.brand}>
          <Link href={routes.home.path} className={styles.logo}>
            <BrandLogo className={styles.logoMark} />
          </Link>
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
        <span className={styles.copyright}>
          © {year} {businessContact.tradingName}. All rights reserved.
        </span>
        <a
          className={styles.credit}
          href="https://oddityone.co.za"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            className={styles.creditMark}
            src="/brand/oddityone-mark.svg"
            alt=""
            width={28}
            height={28}
            unoptimized
          />
          <span className={styles.creditLabel}>Site by</span>
          <span className={styles.creditName}>OddityOne</span>
          <span className={styles.srOnly}> (opens in a new tab)</span>
        </a>
      </div>
    </footer>
  );
}
