'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/contexts/ThemeContext';
import styles from './FloatingThemeToggle.module.css';

export default function FloatingThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className={styles.floatingToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <span className={styles.icon} suppressHydrationWarning>
        {theme === 'light' ? (
          <Moon size={16} strokeWidth={1.6} aria-hidden="true" />
        ) : (
          <Sun size={16} strokeWidth={1.6} aria-hidden="true" />
        )}
      </span>
    </button>
  );
}
