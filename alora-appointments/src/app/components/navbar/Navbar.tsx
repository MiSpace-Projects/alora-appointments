"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { routes } from "@/app/config/routes"
import { useTheme } from "@/app/contexts/ThemeContext"
import styles from "./Navbar.module.css"

const navItems = [
  routes.services,
  routes.bookNow,
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && !(event.target as HTMLElement).closest(`.${styles.menuButton}`)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href={routes.home.path} className={styles.logo}>
          <img src="/alora-hair.png" alt="Alora" className={styles.logoMark} />
          <span className={styles.logoText}><strong>Alora</strong> Appointments</span>
        </Link>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          Menu
        </button>

        <nav ref={menuRef} className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} className={styles.navLink} onClick={() => setMenuOpen(false)}>
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
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className={styles.avatarCircle}>MM</span>
          </button>

          {isOpen && (
            <div className={styles.dropdown}>
              <Link
                href={routes.myProfile.path}
                className={styles.dropdownItem}
                onClick={() => setIsOpen(false)}
              >
                My Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
