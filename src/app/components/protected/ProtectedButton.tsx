'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedButton({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handle = () => {
    if (user) return onClick();
    router.push('/login?next=' + encodeURIComponent(pathname ?? '/'));
  };

  return (
    <button onClick={handle} className={className}>
      {children}
    </button>
  );
}

export default ProtectedButton;
