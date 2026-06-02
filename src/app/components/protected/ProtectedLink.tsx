'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

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
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    onClick?.();
    if (!user) {
      e.preventDefault();
      router.push('/login?next=' + encodeURIComponent(pathname ?? '/'));
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
