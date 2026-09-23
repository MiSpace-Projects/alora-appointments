import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  pathname: string;
}

const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/login': [{ label: 'Welcome Back' }],
  '/register': [{ label: 'Create Account' }],
  '/forgot-password': [{ label: 'Welcome Back', href: '/login' }, { label: 'Reset password' }],
  '/reset-password': [{ label: 'Welcome Back', href: '/login' }, { label: 'Create New Password' }],
  '/two-factor': [{ label: 'Welcome Back', href: '/login' }, { label: 'Two-factor verification' }],
  '/verify-email': [{ label: 'Welcome Back', href: '/login' }, { label: 'Verify your email' }],
  '/profile': [{ label: 'My Profile' }],
  '/book': [{ label: 'My Profile', href: '/profile' }, { label: 'Book an appointment' }],
};

function titleFromSegment(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function breadcrumbsFor(pathname: string): BreadcrumbItem[] {
  const configured = routeBreadcrumbs[pathname];
  if (configured) return configured;

  const segments = pathname.split('/').filter(Boolean);
  return segments.map((segment, index) => {
    const isCurrent = index === segments.length - 1;
    return {
      label: titleFromSegment(segment),
      href: isCurrent ? undefined : `/${segments.slice(0, index + 1).join('/')}`,
    };
  });
}

export function Breadcrumbs({ pathname }: BreadcrumbsProps) {
  const items = breadcrumbsFor(pathname);

  return (
    <nav className={styles.bar} aria-label="Breadcrumb">
      <ol className={styles.list}>
        <li className={styles.item}>
          <Link href="/" className={styles.link}>
            Alora
          </Link>
        </li>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li className={styles.item} key={`${item.label}-${index}`}>
              <ChevronRight className={styles.separator} aria-hidden="true" />
              {item.href && !isCurrent ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
