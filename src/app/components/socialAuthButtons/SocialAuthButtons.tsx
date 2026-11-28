'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { signIn } from '@/lib/auth-client';
import { sanitizeRedirect } from '@/lib/safe-redirect';
import styles from './SocialAuthButtons.module.css';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.37 12.71c-.02-2.24 1.83-3.32 1.91-3.37-1.04-1.52-2.66-1.73-3.24-1.75-1.38-.14-2.69.81-3.39.81-.7 0-1.78-.79-2.92-.77-1.5.02-2.89.87-3.66 2.21-1.56 2.71-.4 6.72 1.12 8.92.74 1.08 1.63 2.29 2.79 2.24 1.12-.04 1.54-.72 2.89-.72 1.35 0 1.73.72 2.91.7 1.2-.02 1.96-1.1 2.7-2.18.85-1.25 1.2-2.46 1.22-2.52-.03-.01-2.33-.9-2.33-3.57zM14.15 6.13c.62-.75 1.03-1.79.92-2.83-.89.04-1.96.59-2.6 1.34-.57.66-1.07 1.72-.94 2.74.99.08 2-.5 2.62-1.25z" />
    </svg>
  );
}

type SocialProvider = 'google' | 'apple';

const PROVIDERS: {
  id: SocialProvider;
  label: string;
  Icon: React.FC;
}[] = [
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'apple', label: 'Apple', Icon: AppleIcon },
];

const PROVIDER_ENABLED: Record<SocialProvider, boolean> = {
  google: process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true',
  apple: process.env.NEXT_PUBLIC_APPLE_ENABLED === 'true',
};

interface SocialAuthProps {
  redirectTo?: string;
  onSuccess?: () => Promise<void>;
}

export function SocialAuthButtons({ redirectTo = '/', onSuccess }: SocialAuthProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  const activeProviders = PROVIDERS.filter((p) => PROVIDER_ENABLED[p.id]);

  if (activeProviders.length === 0) return null;

  const handleSocialLogin = async (provider: SocialProvider) => {
    setLoadingProvider(provider);

    try {
      const destination = sanitizeRedirect(redirectTo);
      const result = await signIn.social({
        provider,
        callbackURL: destination,
        newUserCallbackURL: `/welcome?next=${encodeURIComponent(destination)}`,
        errorCallbackURL: '/login',
      });

      if (result.error) throw new Error(result.error.message ?? 'Social sign-in failed.');

      if (result?.data?.redirect && typeof result.data.url === 'string') {
        window.location.assign(result.data.url);
        return;
      }

      await onSuccess?.();
    } catch {
      toast.error(
        `${PROVIDERS.find((item) => item.id === provider)?.label ?? 'Social'} sign-in failed. Please try again.`,
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>or continue with</span>
        <span className={styles.dividerLine} />
      </div>

      <div className={styles.buttons}>
        {activeProviders.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={styles.socialBtn}
            disabled={loadingProvider !== null}
            onClick={() => handleSocialLogin(id)}
          >
            <span className={styles.iconWrap}>
              {loadingProvider === id ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : (
                <Icon />
              )}
            </span>
            <span className={styles.providerLabel}>Continue with {label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
