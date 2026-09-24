'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { User, LogOut, ArrowUpRight } from 'lucide-react';
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
    <User size={18} strokeWidth={1.8} aria-hidden="true" />
  );

  return (
    <header className={`${styles.header}${scrolled ? ` ${styles.scrolled}` : ''}`}>
      <div className={styles.container}>
        <Link href={routes.home.path} className={styles.logo} onClick={() => setMenuOpen(false)}>
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
          className={`${styles.menuButton}${menuOpen ? ` ${styles.menuButtonOpen}` : ''}`}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className={styles.menuBar} />
          <span className={styles.menuBar} />
          <span className={styles.menuBar} />
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
                  className={styles.navCta}
                  onClick={() => setMenuOpen(false)}
                >
                  {navItem.label}
                  <ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />
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
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownName}>{user.name}</span>
                <span className={styles.dropdownEmail}>{user.email}</span>
              </div>
              <div className={styles.dropdownDivider} />
              <Link
                href={routes.myProfile.path}
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setDropOpen(false)}
              >
                <User size={16} strokeWidth={1.8} aria-hidden="true" />
                {routes.myProfile.label}
              </Link>
              <button
                className={`${styles.dropdownItem} ${styles.dropdownSignOut}`}
                role="menuitem"
                disabled={signingOut}
                onClick={handleSignOut}
              >
                <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
