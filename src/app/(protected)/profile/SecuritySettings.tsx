'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { Download, Link as LinkIcon, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { FormField } from '@/app/components/form/Form';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import styles from './SecuritySettings.module.css';

type SessionList = NonNullable<Awaited<ReturnType<typeof authClient.listSessions>>['data']>;
type DeviceSession = SessionList[number];

interface LinkedAccount {
  providerId: string;
}

interface Enrollment {
  totpURI: string;
  backupCodes: string[];
}

const enabledProviders = [
  ...(process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' ? ['google'] : []),
  ...(process.env.NEXT_PUBLIC_GITHUB_ENABLED === 'true' ? ['github'] : []),
  ...(process.env.NEXT_PUBLIC_DISCORD_ENABLED === 'true' ? ['discord'] : []),
];

function deviceLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Unknown device';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser';
  const platform = /iPhone|iPad/.test(userAgent)
    ? 'iOS'
    : /Android/.test(userAgent)
      ? 'Android'
      : /Macintosh/.test(userAgent)
        ? 'macOS'
        : /Windows/.test(userAgent)
          ? 'Windows'
          : 'Unknown platform';
  return `${browser} on ${platform}`;
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function SecuritySettings({
  initialTwoFactorEnabled,
}: {
  initialTwoFactorEnabled: boolean;
}) {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialTwoFactorEnabled);
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [working, setWorking] = useState(false);

  const loadSecurityState = useCallback(async () => {
    setLoadingSessions(true);
    setSessionError(null);
    try {
      const [sessionResult, currentResult, accountResult] = await Promise.all([
        authClient.listSessions(),
        authClient.getSession({ query: { disableCookieCache: true } }),
        authClient.listAccounts(),
      ]);
      if (sessionResult.error || currentResult.error || accountResult.error) {
        throw new Error('Security state request failed');
      }

      setSessions(sessionResult.data ?? []);
      setCurrentToken(currentResult.data?.session.token ?? null);
      setAccounts(
        Array.isArray(accountResult.data)
          ? accountResult.data.flatMap((account: unknown) =>
              typeof account === 'object' &&
              account !== null &&
              'providerId' in account &&
              typeof account.providerId === 'string'
                ? [{ providerId: account.providerId }]
                : [],
            )
          : [],
      );
    } catch {
      setSessionError('Security information could not be loaded.');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadSecurityState(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadSecurityState]);

  const linkedProviders = useMemo(
    () => new Set(accounts.map((account) => account.providerId)),
    [accounts],
  );

  const startEnrollment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWorking(true);
    const result = await authClient.twoFactor.enable({ password });
    setWorking(false);
    if (result.error || !result.data) {
      toast.error(result.error?.message ?? 'Two-factor setup could not be started.');
      return;
    }
    setEnrollment({
      totpURI: result.data.totpURI,
      backupCodes: result.data.backupCodes,
    });
    setBackupCodes(result.data.backupCodes);
    setPassword('');
  };

  const verifyEnrollment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWorking(true);
    const result = await authClient.twoFactor.verifyTotp({
      code: totpCode.trim(),
      trustDevice: false,
    });
    setWorking(false);
    if (result.error) {
      toast.error(result.error.message ?? 'The authenticator code is invalid.');
      setTotpCode('');
      return;
    }
    setTwoFactorEnabled(true);
    setEnrollment(null);
    setTotpCode('');
    toast.success('Two-factor authentication is enabled.');
    await loadSecurityState();
  };

  const disableTwoFactor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWorking(true);
    const result = await authClient.twoFactor.disable({ password });
    setWorking(false);
    if (result.error) {
      toast.error(result.error.message ?? 'Two-factor authentication could not be disabled.');
      return;
    }
    setTwoFactorEnabled(false);
    setPassword('');
    setBackupCodes([]);
    toast.success('Two-factor authentication is disabled.');
    await loadSecurityState();
  };

  const rotateBackupCodes = async () => {
    if (!password) {
      toast.error('Enter your password before generating new backup codes.');
      return;
    }
    setWorking(true);
    const result = await authClient.twoFactor.generateBackupCodes({ password });
    setWorking(false);
    if (result.error || !result.data) {
      toast.error(result.error?.message ?? 'Backup codes could not be generated.');
      return;
    }
    setBackupCodes(result.data.backupCodes);
    setPassword('');
    toast.success('Previous backup codes have been replaced.');
  };

  const revokeSession = async (token: string) => {
    const result = await authClient.revokeSession({ token });
    if (result.error) {
      toast.error(result.error.message ?? 'The session could not be revoked.');
      return;
    }
    toast.success('Session revoked.');
    await loadSecurityState();
  };

  const revokeOtherSessions = async () => {
    const result = await authClient.revokeOtherSessions();
    if (result.error) {
      toast.error(result.error.message ?? 'Other sessions could not be revoked.');
      return;
    }
    toast.success('All other sessions were revoked.');
    await loadSecurityState();
  };

  const downloadBackupCodes = () => {
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'alora-backup-codes.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.section} aria-labelledby="account-security-heading">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Account</p>
          <h2 id="account-security-heading" className={styles.heading}>
            Security
          </h2>
        </div>
        <ShieldCheck size={24} aria-hidden="true" />
      </div>

      <div className={styles.group}>
        <div className={styles.groupHeading}>
          <div>
            <h3>Two-factor authentication</h3>
            <p>{twoFactorEnabled ? 'Enabled' : 'Not enabled'}</p>
          </div>
        </div>

        {!twoFactorEnabled && !enrollment && (
          <form className={styles.inlineForm} onSubmit={startEnrollment}>
            <FormField
              type="password"
              placeholder="Current password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <SubmitButton loading={working} disabled={!password}>
              Set up authenticator
            </SubmitButton>
          </form>
        )}

        {enrollment && (
          <div className={styles.enrollment}>
            <div className={styles.qrCode}>
              <QRCode value={enrollment.totpURI} size={168} />
            </div>
            <form className={styles.inlineForm} onSubmit={verifyEnrollment}>
              <FormField
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit authenticator code"
                value={totpCode}
                maxLength={6}
                onChange={(event) => setTotpCode(event.target.value)}
              />
              <SubmitButton loading={working} disabled={totpCode.length !== 6}>
                Confirm and enable
              </SubmitButton>
            </form>
          </div>
        )}

        {twoFactorEnabled && (
          <form className={styles.inlineForm} onSubmit={disableTwoFactor}>
            <FormField
              type="password"
              placeholder="Current password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={working || !password}
                onClick={rotateBackupCodes}
              >
                Generate new backup codes
              </button>
              <button type="submit" className={styles.dangerButton} disabled={working || !password}>
                Disable two-factor
              </button>
            </div>
          </form>
        )}

        {backupCodes.length > 0 && (
          <div className={styles.backupBlock}>
            <div className={styles.backupHeader}>
              <strong>Backup codes</strong>
              <button type="button" className={styles.iconButton} onClick={downloadBackupCodes}>
                <Download size={16} />
                <span className="sr-only">Download backup codes</span>
              </button>
            </div>
            <div className={styles.codeGrid}>
              {backupCodes.map((code) => (
                <code key={code}>{code}</code>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.group}>
        <div className={styles.groupHeading}>
          <div>
            <h3>Active sessions</h3>
            <p>Review and revoke devices with access to your account.</p>
          </div>
          {sessions.length > 1 && (
            <button type="button" className={styles.secondaryButton} onClick={revokeOtherSessions}>
              Revoke others
            </button>
          )}
        </div>
        {loadingSessions ? (
          <p className={styles.muted}>Loading sessions...</p>
        ) : sessionError ? (
          <div className={styles.errorRow}>
            <p>{sessionError}</p>
            <button type="button" className={styles.secondaryButton} onClick={loadSecurityState}>
              Retry
            </button>
          </div>
        ) : (
          <div className={styles.rows}>
            {sessions.map((session) => {
              const current = session.token === currentToken;
              return (
                <div className={styles.row} key={session.id}>
                  <div>
                    <strong>{deviceLabel(session.userAgent)}</strong>
                    <p>
                      {current ? 'Current session' : `Last active ${formatDate(session.updatedAt)}`}
                    </p>
                  </div>
                  {!current && (
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => revokeSession(session.token)}
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">Revoke session</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {enabledProviders.length > 0 && (
        <div className={styles.group}>
          <div className={styles.groupHeading}>
            <div>
              <h3>Linked sign-in methods</h3>
              <p>Link providers only after signing in to this account.</p>
            </div>
          </div>
          <div className={styles.buttonRow}>
            {enabledProviders.map((provider) => {
              const linked = linkedProviders.has(provider);
              return (
                <button
                  type="button"
                  key={provider}
                  className={styles.secondaryButton}
                  disabled={linked}
                  onClick={() => authClient.linkSocial({ provider, callbackURL: '/profile' })}
                >
                  <LinkIcon size={15} />
                  {linked ? `${provider} linked` : `Link ${provider}`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
