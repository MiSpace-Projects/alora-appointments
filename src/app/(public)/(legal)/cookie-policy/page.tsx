import type { Metadata } from 'next';
import Link from 'next/link';
import { routes } from '@/app/config/routes';
import { businessContact, legalVersions } from '@/app/config/business';
import { CONSENT_COOKIE_NAME, CONSENT_MAX_AGE_DAYS } from '@/lib/consent';
import { LegalDocument, type LegalSection } from '../LegalDocument';
import { CookieSettingsButton } from '@/app/components/consent/CookieSettingsButton';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'The cookies and browser storage Alora uses, what each one does and how long it lasts.',
  alternates: { canonical: routes.cookies.path },
};

/**
 * Every cookie and storage key this site sets. Keep this table in sync with
 * the auth configuration (better-auth cookie names) and the consent module —
 * the table is the disclosure POPIA s18 requires for online identifiers.
 */
const cookies = [
  {
    name: '__Secure-better-auth.session_token',
    purpose: 'Keeps you signed in. Contains only a random session identifier.',
    type: 'Strictly necessary',
    lifetime: '7 days (or when you close the browser if you untick “remember me”)',
  },
  {
    name: '__Secure-better-auth.dont_remember',
    purpose: 'Set only when you untick “remember me”, so the session ends when the browser closes.',
    type: 'Strictly necessary',
    lifetime: 'Browser session',
  },
  {
    name: '__Secure-better-auth.two_factor',
    purpose: 'Holds a short-lived token between entering your password and your two-factor code.',
    type: 'Strictly necessary',
    lifetime: '5 minutes',
  },
  {
    name: CONSENT_COOKIE_NAME,
    purpose: 'Remembers that you have seen the cookie notice and which version you acknowledged.',
    type: 'Strictly necessary',
    lifetime: `${CONSENT_MAX_AGE_DAYS} days`,
  },
] as const;

const storage = [
  {
    name: 'theme (localStorage)',
    purpose: 'Remembers whether you chose light or dark mode.',
    lifetime: 'Until you clear site data',
  },
  {
    name: 'auth:callback (sessionStorage)',
    purpose: 'Remembers where to send you after two-factor verification.',
    lifetime: 'Until the tab closes',
  },
] as const;

const sections: LegalSection[] = [
  {
    id: 'what-are-cookies',
    title: 'What cookies are',
    content: (
      <p>
        Cookies are small text files a website stores in your browser. Some are essential for a site
        to work (for example, to keep you signed in); others track you for advertising or analytics.
        POPIA treats the identifiers in cookies as personal information, so we tell you exactly
        which ones we use.
      </p>
    ),
  },
  {
    id: 'what-we-use',
    title: 'What we use',
    content: (
      <>
        <div className={styles.callout}>
          <p>
            <strong>We only set strictly necessary cookies.</strong> No advertising, tracking,
            analytics or social-media cookies are set by this site, and no third party sets cookies
            through it. Because strictly necessary cookies are required to deliver the service you
            asked for, POPIA does not require your consent for them; we still show you a notice so
            nothing is hidden.
          </p>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cookie</th>
                <th>Purpose</th>
                <th>Type</th>
                <th>Lifetime</th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((cookie) => (
                <tr key={cookie.name}>
                  <td>
                    <code>{cookie.name}</code>
                  </td>
                  <td>{cookie.purpose}</td>
                  <td>{cookie.type}</td>
                  <td>{cookie.lifetime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The <code>__Secure-</code> prefix means the cookie is only ever sent over HTTPS. All of
          these cookies are marked <em>HttpOnly</em> (not readable by scripts) except the consent
          cookie, and <em>SameSite</em> so other sites cannot send them.
        </p>
        <h3>Browser storage that is not a cookie</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Key</th>
                <th>Purpose</th>
                <th>Lifetime</th>
              </tr>
            </thead>
            <tbody>
              {storage.map((entry) => (
                <tr key={entry.name}>
                  <td>
                    <code>{entry.name}</code>
                  </td>
                  <td>{entry.purpose}</td>
                  <td>{entry.lifetime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Paying online',
    content: (
      <p>
        When you choose to pay online you are taken to a page hosted by Paystack to enter your card
        or bank details. That page is governed by{' '}
        <a href="https://paystack.com/privacy" rel="noopener noreferrer" target="_blank">
          Paystack&rsquo;s privacy policy
        </a>{' '}
        and may set its own cookies for fraud prevention. We do not control those cookies, and they
        are not set on this site.
      </p>
    ),
  },
  {
    id: 'your-choices',
    title: 'Your choices',
    content: (
      <>
        <p>
          You can review or change your cookie choice at any time. If we ever add optional
          (non-essential) cookies, they will be off by default and this page and the notice will ask
          for your opt-in first.
        </p>
        <p>
          <CookieSettingsButton />
        </p>
        <p>
          You can also delete or block cookies in your browser settings. Blocking the session cookie
          will sign you out and prevent booking.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Questions',
    content: (
      <p>
        Questions about cookies or privacy: email{' '}
        <a href={`mailto:${businessContact.email}`}>{businessContact.email}</a>. Our full{' '}
        <Link href={routes.privacy.path}>Privacy Policy</Link> explains your rights and how to
        complain to the Information Regulator.
      </p>
    ),
  },
];

export default function CookiePolicyPage(): React.JSX.Element {
  return (
    <LegalDocument
      kicker="Cookies and storage"
      title="Cookie Policy"
      effectiveDate={legalVersions.cookies}
      lede={
        <>
          A plain list of every cookie and piece of browser storage this website uses, what each one
          is for, and how long it lasts. Short version: only what is needed to sign you in and keep
          your account secure.
        </>
      }
      sections={sections}
    />
  );
}
