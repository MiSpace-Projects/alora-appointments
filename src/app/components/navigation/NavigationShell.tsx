'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '../navbar/Navbar';
import Footer from '../footer/Footer';
import FloatingThemeToggle from '../FloatingThemeToggle';
import { Breadcrumbs } from './Breadcrumbs';

/** Routes that render as a focused, chrome-free auth screen (no footer / toggle). */
const AUTH_ROUTE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/two-factor',
  '/verify-email',
] as const;

interface NavigationShellProps {
  children: ReactNode;
}

export function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname() ?? '/';
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <>
      <Navbar />
      {pathname !== '/' && <Breadcrumbs pathname={pathname} />}
      {children}
      {!isAuthRoute && (
        <>
          <Footer />
          <FloatingThemeToggle />
        </>
      )}
    </>
  );
}
