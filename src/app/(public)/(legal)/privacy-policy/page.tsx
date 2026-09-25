import type { Metadata } from 'next';
import Link from 'next/link';
import { routes } from '@/app/config/routes';
import {
  businessContact,
  businessLegal,
  informationRegulator,
  legalVersions,
} from '@/app/config/business';
import { Fact, LegalDocument, type LegalSection } from '../LegalDocument';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Alora collects, uses, shares and protects your personal information under the Protection of Personal Information Act (POPIA).',
  alternates: { canonical: routes.privacy.path },
};

const sections: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    content: (
      <>
        <p>
          This notice is issued by the salon trading as{' '}
          <strong>{businessContact.tradingName}</strong> (&ldquo;Alora&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;). We are the <em>responsible party</em> under the Protection of Personal
          Information Act 4 of 2013 (&ldquo;POPIA&rdquo;) for the personal information you give us
          through this website.
        </p>
        <dl className={styles.facts}>
          <dt>Trading name</dt>
          <dd>{businessContact.tradingName}</dd>
          <dt>Registered name</dt>
          <dd>
            <Fact value={businessLegal.registeredName} />
          </dd>
          <dt>Legal status</dt>
          <dd>
            <Fact value={businessLegal.legalStatus} />
          </dd>
          <dt>Physical address</dt>
          <dd>
            <Fact value={businessLegal.physicalAddress} label="Street address to be confirmed" /> (
            {businessContact.location}, {businessContact.country})
          </dd>
          <dt>Information Officer</dt>
          <dd>
            <Fact value={businessLegal.informationOfficerName} label="Name to be confirmed" />
            <br />
            <a href={`mailto:${businessLegal.informationOfficerEmail}`}>
              {businessLegal.informationOfficerEmail}
            </a>
            {' · '}
            <a href={`tel:${businessLegal.informationOfficerPhone}`}>
              {businessContact.phoneDisplay}
            </a>
          </dd>
        </dl>
        <p>
          The Information Officer is the person responsible for this notice, for answering your
          privacy requests, and for our registration with the Information Regulator.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    content: (
      <>
        <p>We only collect what the service needs. Specifically:</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Information</th>
                <th>Required?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Account</td>
                <td>Your name, email address and a password (stored only as a one-way hash).</td>
                <td>Yes, to create an account and book.</td>
              </tr>
              <tr>
                <td>Bookings</td>
                <td>
                  The service you choose, the date and time, any notes you add, the price at the
                  time, and the booking status.
                </td>
                <td>Yes, to provide the appointment. Notes are optional.</td>
              </tr>
              <tr>
                <td>Loyalty</td>
                <td>Points earned and redeemed, and the booking each entry relates to.</td>
                <td>Automatic when you complete a booking.</td>
              </tr>
              <tr>
                <td>Payments</td>
                <td>
                  If you pay online: the amount, currency, payment reference, status and payment
                  channel returned by our payment processor. We never see or store your full card
                  number, CVV or bank login.
                </td>
                <td>Only if you choose to pay online.</td>
              </tr>
              <tr>
                <td>Security</td>
                <td>
                  A hashed (irreversible) form of your IP address, your browser&rsquo;s user-agent
                  string, a device fingerprint, sign-in events and, if you enable it, an encrypted
                  two-factor secret and backup codes.
                </td>
                <td>Automatic; needed to keep your account safe.</td>
              </tr>
              <tr>
                <td>Consent records</td>
                <td>
                  When you accepted these terms and the cookie notice, which version, and whether
                  you opted in to marketing.
                </td>
                <td>Automatic, so we can prove what you agreed to.</td>
              </tr>
              <tr>
                <td>Correspondence</td>
                <td>Emails and messages you send us, and our replies.</td>
                <td>Only if you contact us.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We do not collect special personal information (such as health, biometric or religious
          data). Please do not put such details in booking notes.
        </p>
      </>
    ),
  },
  {
    id: 'sources',
    title: 'Where it comes from',
    content: (
      <>
        <p>Almost everything comes directly from you. The exceptions:</p>
        <ul>
          <li>
            <strong>Payment processor.</strong> When you pay online, Paystack tells us whether the
            payment succeeded, the amount, and the payment channel (for example &ldquo;card&rdquo;
            or &ldquo;EFT&rdquo;).
          </li>
          <li>
            <strong>Social sign-in.</strong> If social sign-in is offered and you use it, the
            provider (for example Google) sends us your name, email address and profile picture.
          </li>
          <li>
            <strong>Your browser.</strong> Technical details such as IP address and user-agent are
            sent automatically with every request.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'why',
    title: 'Why we use it, and our legal basis',
    content: (
      <>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Purpose</th>
                <th>Legal basis (POPIA s11)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Creating and managing your account and bookings</td>
                <td>Performance of our agreement with you (s11(1)(b))</td>
              </tr>
              <tr>
                <td>Taking payment, issuing refunds and keeping transaction records</td>
                <td>
                  Performance of the agreement; legal obligation to keep financial records
                  (s11(1)(c))
                </td>
              </tr>
              <tr>
                <td>Running the loyalty programme</td>
                <td>Performance of the agreement</td>
              </tr>
              <tr>
                <td>Sending booking confirmations, reminders, verification and security emails</td>
                <td>
                  Performance of the agreement; our legitimate interest in account security
                  (s11(1)(f))
                </td>
              </tr>
              <tr>
                <td>Detecting and preventing fraud, abuse and unauthorised access</td>
                <td>Legitimate interest (s11(1)(f))</td>
              </tr>
              <tr>
                <td>Marketing emails about offers and new services</td>
                <td>Your consent, which you can withdraw at any time (s11(1)(a), s69)</td>
              </tr>
              <tr>
                <td>Complying with tax, consumer and other laws</td>
                <td>Legal obligation (s11(1)(c))</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We do not sell your personal information, and we do not use it for automated decisions
          that have legal or similarly significant effects on you.
        </p>
      </>
    ),
  },
  {
    id: 'mandatory',
    title: 'What happens if you do not provide it',
    content: (
      <>
        <p>
          Providing your name, email address and a password is <strong>mandatory</strong> to open an
          account; without them we cannot create bookings for you. Choosing a service and time is
          mandatory to book. Everything else (booking notes, paying online, marketing opt-in,
          two-factor authentication) is <strong>voluntary</strong> and the service works without it.
        </p>
        <p>
          <strong>Laws that require us to keep some records:</strong> the Tax Administration Act 28
          of 2011 requires us to keep records of payments for five years; the Electronic
          Communications and Transactions Act 25 of 2002 and the Consumer Protection Act 68 of 2008
          require us to keep a record of online transactions and to be able to show what you agreed
          to.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    content: (
      <>
        <p>
          We use a small number of service providers (&ldquo;operators&rdquo; under POPIA s20 and
          s21). Each one may only process your information on our instructions, under a written
          agreement, and must keep it secure.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Provider</th>
                <th>What they do</th>
                <th>Where</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vercel Inc.</td>
                <td>Hosts this website and runs its code.</td>
                <td>United States</td>
              </tr>
              <tr>
                <td>Neon Inc.</td>
                <td>Hosts our database.</td>
                <td>United Kingdom (London region)</td>
              </tr>
              <tr>
                <td>Resend Inc.</td>
                <td>
                  Sends our transactional emails (verification, password reset, security alerts).
                </td>
                <td>United States</td>
              </tr>
              <tr>
                <td>Paystack Payments (Pty) Ltd</td>
                <td>
                  Processes online payments and refunds. Card details are entered on
                  Paystack&rsquo;s secure page, not ours.
                </td>
                <td>South Africa (part of the Stripe group)</td>
              </tr>
              <tr>
                <td>Have I Been Pwned</td>
                <td>
                  Checks whether a password you choose has appeared in a known data breach. Only the
                  first five characters of a hash of the password are sent, never the password
                  itself.
                </td>
                <td>United Kingdom / global CDN</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We will also disclose information where the law requires it (for example to SARS, a court,
          or the Information Regulator), or to protect our rights or the safety of our clients and
          staff. We do not share your information with advertisers.
        </p>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'Transfers outside South Africa',
    content: (
      <>
        <p>
          Because some of our providers are in the United States and the United Kingdom, your
          information is transferred outside South Africa. POPIA s72 allows this where the recipient
          is bound by an agreement that upholds substantially similar protections. Each provider
          above is bound by a data-processing agreement with security, confidentiality and
          onward-transfer commitments; our database provider operates in the UK, whose data
          protection law (UK GDPR) provides protection comparable to POPIA.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    content: (
      <>
        <ul>
          <li>
            <strong>Account details:</strong> for as long as your account is open, and then deleted
            or anonymised within 30 days of you closing it.
          </li>
          <li>
            <strong>Bookings and payment records:</strong> five years from the transaction, as
            required by tax law. After you close your account these records are kept without your
            name or email attached.
          </li>
          <li>
            <strong>Security logs:</strong> twelve months.
          </li>
          <li>
            <strong>Consent records:</strong> for as long as your account is open, plus three years,
            so we can show what you agreed to.
          </li>
          <li>
            <strong>Correspondence:</strong> up to three years after the matter is closed.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect it',
    content: (
      <>
        <p>
          POPIA s19 requires appropriate, reasonable safeguards. Ours include: encryption of all
          traffic (HTTPS with HSTS), one-way hashing of passwords, encrypted two-factor secrets,
          optional two-factor authentication, sign-in rate limiting and new-device alerts, a strict
          Content Security Policy, access limited to the people who need it, and payment pages
          hosted by a PCI DSS compliant processor so card data never touches our systems.
        </p>
        <p>
          If a security compromise affects your personal information, we will notify you and the
          Information Regulator as soon as reasonably possible, as POPIA s22 requires.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    content: (
      <>
        <p>Under POPIA you may, free of charge unless the Act allows a fee:</p>
        <ul>
          <li>
            <strong>Ask what we hold about you</strong> and get a copy (s23).
          </li>
          <li>
            <strong>Have it corrected or deleted</strong> if it is inaccurate, out of date,
            excessive or no longer needed (s24). You can edit your details and delete your account
            from your <Link href={routes.myProfile.path}>profile</Link>.
          </li>
          <li>
            <strong>Object</strong> to processing based on our legitimate interests (s11(3)).
          </li>
          <li>
            <strong>Withdraw consent</strong> to marketing at any time (s11(2)(b), s69), using the
            unsubscribe link in any marketing email or from your profile.
          </li>
          <li>
            <strong>Complain</strong> to the Information Regulator (see{' '}
            <a href="#complaints">complaints</a>).
          </li>
        </ul>
        <p>
          To exercise a right, email our Information Officer at{' '}
          <a href={`mailto:${businessLegal.informationOfficerEmail}?subject=POPIA%20request`}>
            {businessLegal.informationOfficerEmail}
          </a>{' '}
          from the address on your account, or use the forms in our{' '}
          <Link href={routes.paia.path}>PAIA manual</Link>. We may ask you to confirm your identity.
          We respond within 30 days.
        </p>
      </>
    ),
  },
  {
    id: 'marketing',
    title: 'Marketing',
    content: (
      <p>
        We only send marketing email if you tick the marketing box when you register or later turn
        it on in your profile (POPIA s69 opt-in). Every marketing email includes a one-click
        unsubscribe. Booking confirmations, reminders and security alerts are service messages, not
        marketing, and are sent to every account holder.
      </p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    content: (
      <p>
        You must be 18 or older to hold an account. If a service (for example a matric farewell
        look) is for someone under 18, a parent or guardian must hold the account and make the
        booking, and by doing so consents to our processing the minor&rsquo;s name and appointment
        details for that booking only (POPIA s35). We do not knowingly collect information from
        children directly.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: (
      <p>
        This site uses only strictly necessary cookies (for signing in, security and remembering
        your cookie choice). No advertising or analytics cookies are set. Full details, including
        each cookie&rsquo;s name and lifetime, are in our{' '}
        <Link href={routes.cookies.path}>Cookie Policy</Link>.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this notice',
    content: (
      <p>
        We will update this notice when our practices change. The effective date and version at the
        top always show the current version. For material changes we will email account holders
        before the change takes effect and, where the change needs it, ask for your consent again.
      </p>
    ),
  },
  {
    id: 'complaints',
    title: 'Complaints and the Information Regulator',
    content: (
      <>
        <p>
          Please raise any concern with our Information Officer first; we take privacy complaints
          seriously and will respond within 30 days. You also have the right to lodge a complaint
          directly with the Regulator:
        </p>
        <dl className={styles.facts}>
          <dt>Regulator</dt>
          <dd>{informationRegulator.name}</dd>
          <dt>Address</dt>
          <dd>{informationRegulator.address}</dd>
          <dt>POPIA complaints</dt>
          <dd>
            <a href={`mailto:${informationRegulator.complaintsEmail}`}>
              {informationRegulator.complaintsEmail}
            </a>
          </dd>
          <dt>Enquiries</dt>
          <dd>
            <a href={`mailto:${informationRegulator.enquiriesEmail}`}>
              {informationRegulator.enquiriesEmail}
            </a>
          </dd>
          <dt>Website</dt>
          <dd>
            <a href={informationRegulator.website} rel="noopener noreferrer" target="_blank">
              {informationRegulator.website}
            </a>
          </dd>
        </dl>
      </>
    ),
  },
];

export default function PrivacyPolicyPage(): React.JSX.Element {
  return (
    <LegalDocument
      kicker="Privacy notice · POPIA"
      title="Privacy Policy"
      effectiveDate={legalVersions.privacy}
      lede={
        <>
          This notice explains, in plain language, what personal information Alora collects when you
          use this website, why, who we share it with and how long we keep it, and the rights you
          have under South Africa&rsquo;s Protection of Personal Information Act. It is our
          notification to you under section 18 of that Act.
        </>
      }
      sections={sections}
    />
  );
}
