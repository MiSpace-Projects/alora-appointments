import Link from 'next/link';
import styles from './owner.module.css';

const TABS = [
  { href: '/owner', label: 'Bookings', key: 'bookings' },
  { href: '/owner/customers', label: 'Customers', key: 'customers' },
] as const;

export function OwnerTabs({ active }: { active: (typeof TABS)[number]['key'] }) {
  return (
    <nav className={styles.tabs} aria-label="Owner sections">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={styles.tab}
          aria-current={tab.key === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
