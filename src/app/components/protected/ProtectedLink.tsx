'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/login?next=' + encodeURIComponent(pathname ?? '/'));
    }
  };

  if (user)
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  return (
    // Render a link that intercepts clicks when not authenticated

    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

export default ProtectedLink;
