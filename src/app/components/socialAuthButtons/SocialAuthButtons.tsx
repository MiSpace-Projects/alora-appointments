'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { signIn } from '@/lib/auth-client';
import { authLogger } from '@/lib/auth-logger';
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

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
    </svg>
  );
}

type SocialProvider = 'google' | 'github' | 'discord';

const PROVIDERS: {
  id: SocialProvider;
  label: string;
  Icon: React.FC;
  envKey: string;
}[] = [
  { id: 'google', label: 'Google', Icon: GoogleIcon, envKey: 'NEXT_PUBLIC_GOOGLE_ENABLED' },
  { id: 'github', label: 'GitHub', Icon: GitHubIcon, envKey: 'NEXT_PUBLIC_GITHUB_ENABLED' },
  { id: 'discord', label: 'Discord', Icon: DiscordIcon, envKey: 'NEXT_PUBLIC_DISCORD_ENABLED' },
];

interface SocialAuthProps {
  redirectTo?: string;
  onSuccess?: () => Promise<void>;
}

export function SocialAuthButtons({ redirectTo = '/', onSuccess }: SocialAuthProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  const activeProviders = PROVIDERS.filter((p) => process.env[p.envKey] === 'true');

  if (activeProviders.length === 0) return null;

  const handleSocialLogin = async (provider: SocialProvider) => {
    setLoadingProvider(provider);
    authLogger.socialLoginInitiated(provider);

    try {
      const result = (await signIn.social({
        provider,
        callbackURL: redirectTo,
      })) as { data?: { redirect?: boolean; url?: string } };

      if (result?.data?.redirect && typeof result.data.url === 'string') {
        window.location.assign(result.data.url);
        return;
      }

      await onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Social sign-in failed.';
      authLogger.socialLoginFailure(provider, msg);
      toast.error(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in failed. Please try again.`,
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
            aria-label={`Sign in with ${label}`}
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
            <span className={styles.providerLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
