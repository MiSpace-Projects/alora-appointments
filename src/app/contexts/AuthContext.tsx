'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getSession,
  signIn as _signIn,
  signOut as _signOut,
  signUp as _signUp,
} from '@/lib/auth-client';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signIn: typeof _signIn;
  signOut: () => Promise<void>;
  signUp: typeof _signUp;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await getSession();
      setUser((session?.data?.user as AuthUser) ?? null);
    } catch {
      setUser(null);
      setError('Failed to load session.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await refresh();
    };

    void init();
  }, [refresh]);

  const wrappedSignOut = useCallback(async () => {
    await _signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refresh,
      signIn: _signIn,
      signOut: wrappedSignOut,
      signUp: _signUp,
    }),
    [user, loading, error, refresh, wrappedSignOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(pathname ?? '/')}`);
    }
  }, [user, loading, router, pathname, redirectTo]);

  return { user, loading };
}
