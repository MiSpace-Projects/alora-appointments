'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    onClick?.();
    if (!user) {
      e.preventDefault();
      // Send them to login, then back to where this link was taking them
      // (the destination), not the page they clicked from.
      router.push(loginWithCallback(href));
    }
  };

  if (user)
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

export default ProtectedLink;
