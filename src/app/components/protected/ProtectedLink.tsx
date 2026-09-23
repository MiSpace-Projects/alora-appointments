'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { loginWithCallback } from '@/lib/safe-redirect';

export function ProtectedLink({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { user } = useAuth();

  if (user)
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  return (
    <a href={loginWithCallback(href)} onClick={onClick} className={className}>
      {children}
    </a>
  );
}

export default ProtectedLink;
