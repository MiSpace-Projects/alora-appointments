'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/app/config/routes';
import { businessLegal } from '@/app/config/business';
import { FormField } from '@/app/components/form/Form';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import { setMarketingOptInAction } from './privacy-actions';
import styles from './SecuritySettings.module.css';

interface PrivacySettingsProps {
  initialMarketingOptIn: boolean;
  hasPassword: boolean;
}

export function PrivacySettings({ initialMarketingOptIn, hasPassword }: PrivacySettingsProps) {
  const router = useRouter();
  const [marketingOptIn, setMarketingOptIn] = useState(initialMarketingOptIn);
  const [savingMarketing, startMarketing] = useTransition();
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [needsReauthentication, setNeedsReauthentication] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const toggleMarketing = () => {
    const next = !marketingOptIn;
    setMarketingOptIn(next);
    startMarketing(async () => {
      const result = await setMarketingOptInAction(next);
      if (!result.ok) {
        setMarketingOptIn(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? 'You will receive offers by email.' : 'Marketing emails switched off.');
    });
  };

  const requestDeletion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasPassword && !password) return;
    setDeleting(true);
    try {
      const { error } = await authClient.deleteUser(
        hasPassword ? { password, callbackURL: '/' } : { callbackURL: '/' },
      );
      if (error) {
        if (error.code === 'SESSION_NOT_FRESH') {
          setNeedsReauthentication(true);
          return;
        }
        toast.error(error.message ?? 'Could not start account deletion.');
        return;
      }
      setDeleteRequested(true);
      setPassword('');
      toast.success('Check your email to confirm deletion.');
    } catch {
      toast.error('Could not start account deletion. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const signInAgain = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push(`/login?callbackUrl=${encodeURIComponent(routes.myProfile.path)}`);
    } catch {
      toast.error('Could not sign you out. Please try again.');
      setSigningOut(false);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="account-privacy-heading">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Account</p>
          <h2 id="account-privacy-heading" className={styles.heading}>
            Privacy
          </h2>
        </div>
        <Lock size={24} aria-hidden="true" />
      </div>

      <div className={styles.group}>
        <div className={styles.groupHeading}>
          <div>
            <h3>Marketing emails</h3>
            <p>
              {marketingOptIn
                ? 'On. We may email you about offers and new services.'
                : 'Off. You only receive booking and security emails.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={marketingOptIn}
            aria-label="Marketing emails"
            className={styles.secondaryButton}
            disabled={savingMarketing}
            onClick={toggleMarketing}
          >
            {marketingOptIn ? 'Turn off' : 'Turn on'}
          </button>
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupHeading}>
          <div>
            <h3>Your data</h3>
            <p>
              Ask for a copy of everything we hold about you, or have it corrected, by emailing{' '}
              <a href={`mailto:${businessLegal.informationOfficerEmail}?subject=POPIA%20request`}>
                {businessLegal.informationOfficerEmail}
              </a>{' '}
              from this account&rsquo;s address. We respond within 30 days. See the{' '}
              <Link href={routes.privacy.path}>Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupHeading}>
          <div>
            <h3>Delete account</h3>
            <p>
              Removes your sign-in, personal details and loyalty points. Bookings and payments are
              kept for five years without your name, as tax law requires. We will email you a link
              to confirm.
            </p>
          </div>
        </div>
        {deleteRequested ? (
          <p className={styles.muted}>
            Confirmation email sent. The link expires in 24 hours; nothing is deleted until you
            click it.
          </p>
        ) : needsReauthentication ? (
          <div className={styles.inlineForm} role="alert">
            <p className={styles.muted}>
              For your security, sign in again, then come back here to delete your account.
            </p>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={signingOut}
              onClick={signInAgain}
            >
              Sign in again
            </button>
          </div>
        ) : (
          <form className={styles.inlineForm} onSubmit={requestDeletion}>
            {hasPassword && (
              <FormField
                type="password"
                placeholder="Current password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
            <SubmitButton
              loading={deleting}
              disabled={hasPassword && !password}
              className={styles.dangerSubmit}
            >
              Delete my account
            </SubmitButton>
          </form>
        )}
      </div>
    </section>
  );
}
