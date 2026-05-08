"use client"

import { useTheme } from "@/app/contexts/ThemeContext"
import styles from "./FloatingThemeToggle.module.css"

export default function FloatingThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className={styles.floatingToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  )
}