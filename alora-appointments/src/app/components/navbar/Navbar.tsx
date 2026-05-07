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
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
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

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} className={styles.navLink}>
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
            <span className={styles.avatarCircle}>AM</span>
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
