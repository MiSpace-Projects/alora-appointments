'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '../navbar/Navbar';
import { Breadcrumbs } from './Breadcrumbs';

interface NavigationShellProps {
  children: ReactNode;
}

export function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname() ?? '/';

  return (
    <>
      <Navbar />
      {pathname !== '/' && <Breadcrumbs pathname={pathname} />}
      {children}
    </>
  );
}
