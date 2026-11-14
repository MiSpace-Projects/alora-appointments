'use client';

import { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function getServerTheme(): Theme {
  return 'light';
}

function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    window.localStorage.setItem('theme', theme);
  } catch {}
  listeners.forEach((listener) => listener());
}

function toggleTheme(): void {
  setTheme(getTheme() === 'light' ? 'dark' : 'light');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
