'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { routes } from '@/app/config/routes';
import { navItems, avatarMenuItems } from './navbarData';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(`.${styles.menuButton}`)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.avatarWrapper} ref={dropdownRef}>
          <button
            type="button"
            className={styles.avatarButton}
            aria-haspopup="true"
            aria-expanded={isOpen}
            aria-label="Open account menu"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className={styles.avatarCircle}>MM</span>
          </button>

          {isOpen && (
            <div className={styles.dropdown} role="menu">
              {avatarMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
