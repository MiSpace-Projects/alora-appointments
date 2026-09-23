'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { sanitizeRedirect } from '@/lib/safe-redirect';
import { AuthBackground } from '@/app/components/AuthBackground';
import { AuthCard, AuthHeader } from '@/app/components/authCard/AuthCard';
import { FormField } from '@/app/components/form/Form';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import styles from '../shared.module.css';

export default function TwoFactorPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'totp' | 'backup'>('totp');
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);

  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const result =
        mode === 'totp'
          ? await authClient.twoFactor.verifyTotp({ code: code.trim(), trustDevice })
          : await authClient.twoFactor.verifyBackupCode({
              code: code.trim(),
              trustDevice,
              disableSession: false,
            });

      if (result.error)
        throw new Error(result.error.message ?? 'The verification code is invalid.');

      const destination = sanitizeRedirect(sessionStorage.getItem('auth:callback'));
      sessionStorage.removeItem('auth:callback');
      router.replace(destination);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The verification code is invalid.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthBackground />
      <div className={styles.page}>
        <div className={styles.cardWrap}>
          <AuthCard>
            <AuthHeader />
            <div className={styles.headingBlock}>
              <h1 className={styles.title}>Two-factor verification</h1>
              <p className={styles.subtitle}>
                {mode === 'totp'
                  ? 'Enter the code from your authenticator app.'
                  : 'Enter one of your unused backup codes.'}
              </p>
            </div>
            <form onSubmit={verify} className={styles.form}>
              <FormField
                type="text"
                inputMode={mode === 'totp' ? 'numeric' : 'text'}
                autoComplete="one-time-code"
                placeholder={mode === 'totp' ? '6-digit code' : 'Backup code'}
                value={code}
                maxLength={mode === 'totp' ? 6 : 32}
                onChange={(event) => setCode(event.target.value)}
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={trustDevice}
                  onChange={(event) => setTrustDevice(event.target.checked)}
                />
                <span className={styles.checkboxText}>Trust this device for 30 days</span>
              </label>
              <SubmitButton loading={loading}>Verify</SubmitButton>
            </form>
            <p className={styles.footer}>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  setCode('');
                  setMode((current) => (current === 'totp' ? 'backup' : 'totp'));
                }}
              >
                {mode === 'totp' ? 'Use a backup code' : 'Use authenticator code'}
              </button>
            </p>
            <p className={styles.footer}>
              <Link href="/login" className={styles.backLink}>
                <ArrowLeft size={12} />
                Back to sign in
              </Link>
            </p>
          </AuthCard>
        </div>
      </div>
    </>
  );
}
