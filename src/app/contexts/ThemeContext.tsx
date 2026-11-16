'use client';

import { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();
let stopWatching: (() => void) | null = null;

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function savedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function preferredTheme(): Theme {
  return savedTheme() ?? (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light');
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (root.getAttribute('data-theme') !== theme) root.setAttribute('data-theme', theme);
}

function ensureTheme(): void {
  if (!isTheme(document.documentElement.getAttribute('data-theme'))) applyTheme(preferredTheme());
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function watch(): () => void {
  ensureTheme();
  const observer = new MutationObserver(() => {
    ensureTheme();
    notify();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const media = window.matchMedia(DARK_QUERY);
  const onSystemChange = (): void => {
    if (!savedTheme()) applyTheme(media.matches ? 'dark' : 'light');
  };
  media.addEventListener('change', onSystemChange);

  const onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY) applyTheme(preferredTheme());
  };
  window.addEventListener('storage', onStorage);

  return () => {
    observer.disconnect();
    media.removeEventListener('change', onSystemChange);
    window.removeEventListener('storage', onStorage);
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!stopWatching) stopWatching = watch();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && stopWatching) {
      stopWatching();
      stopWatching = null;
    }
  };
}

function getTheme(): Theme {
  const current = document.documentElement.getAttribute('data-theme');
  return isTheme(current) ? current : preferredTheme();
}

function getServerTheme(): Theme {
  return 'light';
}

function setTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  notify();
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
