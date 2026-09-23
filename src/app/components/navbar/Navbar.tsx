'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { routes } from '@/app/config/routes';
import { navItems } from './navbarData';
import ProtectedLink from '../protected/ProtectedLink';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import styles from './Navbar.module.css';

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(`.${styles.menuButton}`)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropOpen(false);
    setSigningOut(true);
    try {
      await signOut();
      window.location.replace('/');
    } catch {
      toast.error('Could not sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const avatarContent = loading ? null : user ? (
    getInitials(user.name)
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z"
        fill="currentColor"
      />
      <path d="M3 20c0-3.866 3.582-7 9-7s9 3.134 9 7v1H3v-1z" fill="currentColor" />
    </svg>
  );

  return (
    <header className={`${styles.header}${scrolled ? ` ${styles.scrolled}` : ''}`}>
      <div className={styles.container}>
        <Link href={routes.home.path} className={styles.logo}>
          <Image
            src="/alora-hair.png"
            alt="Alora"
            className={styles.logoMark}
            width={32}
            height={32}
          />
          <span className={styles.logoText}>
            <strong>Alora</strong> Appointments
          </span>
        </Link>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <nav
          ref={menuRef}
          className={`${styles.nav}${menuOpen ? ` ${styles.open}` : ''}`}
          aria-label="Main navigation"
        >
          {navItems.map((navItem) => {
            const isBookNow = navItem.path === routes.bookNow.path;
            if (isBookNow) {
              return (
                <ProtectedLink
                  key={navItem.path}
                  href={navItem.path}
                  className={styles.navLink}
                  onClick={() => setMenuOpen(false)}
                >
                  {navItem.label}
                </ProtectedLink>
              );
            }
            return (
              <Link
                key={navItem.path}
                href={navItem.path}
                className={styles.navLink}
                onClick={() => setMenuOpen(false)}
              >
                {navItem.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.avatarWrapper} ref={dropdownRef}>
          {loading ? (
            <span className={styles.avatarButton} aria-hidden="true">
              <span className={styles.avatarCircle}>{avatarContent}</span>
            </span>
          ) : user ? (
            <button
              type="button"
              className={styles.avatarButton}
              aria-haspopup="true"
              aria-expanded={dropOpen}
              aria-label="Open account menu"
              onClick={() => setDropOpen((prev) => !prev)}
            >
              <span className={styles.avatarCircle}>{avatarContent}</span>
            </button>
          ) : (
            <Link href="/login" className={styles.avatarButton} aria-label="Sign in">
              <span className={styles.avatarCircle}>{avatarContent}</span>
            </Link>
          )}

          {dropOpen && user && (
            <div className={styles.dropdown} role="menu">
              <Link
                href={routes.myProfile.path}
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setDropOpen(false)}
              >
                {routes.myProfile.label}
              </Link>
              <button
                className={styles.dropdownItem}
                role="menuitem"
                disabled={signingOut}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
