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
  title: 'PAIA Manual',
  description:
    'Manual prepared in terms of section 51 of the Promotion of Access to Information Act 2 of 2000 and regulation 4 of the POPIA regulations.',
  alternates: { canonical: routes.paia.path },
};

/** Prescribed fees for private bodies (PAIA Regulations, 2021, Annexure B). */
const fees = [
  { item: 'Request fee (payable when the request is made)', amount: 'R140.00' },
  { item: 'Photocopy or printed A4 page', amount: 'R2.00 per page' },
  { item: 'Electronic copy on a flash drive or CD you provide', amount: 'R40.00' },
  {
    item: 'Search and preparation, per hour after the first hour',
    amount: 'R145.00 (max R435.00)',
  },
  { item: 'Deposit if search will exceed 6 hours', amount: 'One third of the access fee' },
] as const;

const regulatorGuideUrl =
  'https://inforegulator.org.za/wp-content/uploads/2020/07/PAIA-Guide-English_20210905.pdf';
const paiaFormsUrl = 'https://inforegulator.org.za/paia-forms/';

const sections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: (
      <p>
        This manual is published in terms of section 51 of the Promotion of Access to Information
        Act 2 of 2000 (&ldquo;PAIA&rdquo;) and regulation 4 of the Regulations Relating to the
        Protection of Personal Information, 2018. It explains what records{' '}
        {businessContact.tradingName} (&ldquo;Alora&rdquo;) holds, how to request access to them,
        and how we process personal information. It should be read with our{' '}
        <Link href={routes.privacy.path}>Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Information Officer and contact details',
    content: (
      <dl className={styles.facts}>
        <dt>Private body</dt>
        <dd>
          {businessContact.tradingName} (
          <Fact value={businessLegal.registeredName} label="registered name to be confirmed" />)
        </dd>
        <dt>Information Officer</dt>
        <dd>
          <Fact value={businessLegal.informationOfficerName} label="Name to be confirmed" />
        </dd>
        <dt>Physical address</dt>
        <dd>
          <Fact value={businessLegal.physicalAddress} label="Street address to be confirmed" />,{' '}
          {businessContact.location}, {businessContact.country}
        </dd>
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${businessLegal.informationOfficerEmail}`}>
            {businessLegal.informationOfficerEmail}
          </a>
        </dd>
        <dt>Telephone</dt>
        <dd>
          <a href={`tel:${businessLegal.informationOfficerPhone}`}>
            {businessContact.phoneDisplay}
          </a>
        </dd>
        <dt>Website</dt>
        <dd>{businessContact.website}</dd>
      </dl>
    ),
  },
  {
    id: 'guide',
    title: 'The Regulator’s guide on how to use PAIA',
    content: (
      <>
        <p>
          The Information Regulator has published a guide (section 10 of PAIA) in all official
          languages explaining how to request records and how the Act works. It is available free of
          charge:
        </p>
        <ul>
          <li>
            Online at{' '}
            <a href={regulatorGuideUrl} rel="noopener noreferrer" target="_blank">
              inforegulator.org.za
            </a>
          </li>
          <li>
            From the Regulator at {informationRegulator.address}, or{' '}
            <a href={`mailto:${informationRegulator.enquiriesEmail}`}>
              {informationRegulator.enquiriesEmail}
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'automatic',
    title: 'Records available without a request',
    content: (
      <p>
        The following are available on this website to anyone: this manual, our Privacy Policy,
        Cookie Policy, Terms &amp; Booking Policy, our service menu and prices, and our contact
        details.
      </p>
    ),
  },
  {
    id: 'records',
    title: 'Records we hold and may make available on request',
    content: (
      <>
        <p>
          Subject to the grounds for refusal in PAIA, we hold the following categories of records:
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Categories of records</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Clients</td>
                <td>
                  Account details, booking history, loyalty ledger, payment and refund records,
                  consent records, correspondence.
                </td>
              </tr>
              <tr>
                <td>Business and financial</td>
                <td>
                  Invoices, payment-processor statements, bank records, tax records, supplier
                  agreements.
                </td>
              </tr>
              <tr>
                <td>Personnel</td>
                <td>
                  Employment contracts, payroll and leave records, training records (where staff are
                  employed).
                </td>
              </tr>
              <tr>
                <td>Information technology</td>
                <td>
                  Security event logs, device records, system configuration, data-processing
                  agreements with operators.
                </td>
              </tr>
              <tr>
                <td>Statutory</td>
                <td>Registration documents, licences, this manual and related policies.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: 'other-legislation',
    title: 'Records available under other legislation',
    content: (
      <p>
        Some records may be requested under other laws, including the Companies Act 71 of 2008, the
        Consumer Protection Act 68 of 2008, the Electronic Communications and Transactions Act 25 of
        2002, the Tax Administration Act 28 of 2011, the Basic Conditions of Employment Act 75 of
        1997 and the Protection of Personal Information Act 4 of 2013.
      </p>
    ),
  },
  {
    id: 'processing',
    title: 'How we process personal information (POPIA regulation 4)',
    content: (
      <>
        <h3>Purpose of processing</h3>
        <p>
          To create and manage client accounts; to book, confirm, deliver, cancel and refund
          appointments; to run a loyalty programme; to take payment; to keep accounts secure; to
          send service and, with consent, marketing communications; and to comply with the law.
        </p>
        <h3>Categories of data subjects and information</h3>
        <ul>
          <li>
            <strong>Clients:</strong> name, email, hashed password, booking details and notes,
            loyalty points, payment references and status, hashed IP address, device and sign-in
            records, consent records.
          </li>
          <li>
            <strong>Staff and contractors</strong> (where applicable): identity, contact, employment
            and payment details.
          </li>
          <li>
            <strong>Suppliers:</strong> contact and banking details of representatives.
          </li>
        </ul>
        <h3>Recipients</h3>
        <p>
          Our hosting, database, email and payment operators listed in the Privacy Policy; our
          accountants and legal advisers where needed; SARS, courts and regulators where the law
          requires.
        </p>
        <h3>Cross-border flows</h3>
        <p>
          Hosting and email operators are in the United States and our database operator is in the
          United Kingdom, each under a data-processing agreement that upholds protections
          substantially similar to POPIA (section 72(1)(a)).
        </p>
        <h3>Security measures</h3>
        <p>
          Encryption in transit, hashed passwords, encrypted two-factor secrets, rate limiting,
          new-device alerts, least-privilege access, a strict Content Security Policy, PCI DSS
          compliant hosted payment pages, and written agreements with all operators. Security
          compromises are notified to affected persons and the Regulator (section 22).
        </p>
      </>
    ),
  },
  {
    id: 'how-to-request',
    title: 'How to request a record',
    content: (
      <>
        <ol>
          <li>
            Complete <strong>Form 2</strong> (Request for Access to Record of Private Body),
            available from the Regulator at{' '}
            <a href={paiaFormsUrl} rel="noopener noreferrer" target="_blank">
              inforegulator.org.za/paia-forms
            </a>
            . Describe the record clearly, say which right you need it to protect or exercise, and
            give us an address or email to reply to.
          </li>
          <li>
            Send it to the Information Officer by email or post (details above), with the request
            fee. You may ask for a specific form of access (for example a copy by email).
          </li>
          <li>
            We will decide within <strong>30 days</strong>, which we may extend once by up to 30
            days for large or complex requests, and tell you in writing. If access is granted, we
            will tell you the access fee (if any) and provide the record once it is paid.
          </li>
          <li>
            If we refuse, we will give reasons and tell you how to complain to the Information
            Regulator using <strong>Form 5</strong>.
          </li>
        </ol>
        <p>
          <strong>Your own personal information:</strong> you do not need Form 2 to see or correct
          your own details. Email the Information Officer from your account email, or use your
          profile page, and we will respond within 30 days at no charge (POPIA s23 and s24).
        </p>
      </>
    ),
  },
  {
    id: 'fees',
    title: 'Fees',
    content: (
      <>
        <p>The fees prescribed for private bodies by the PAIA Regulations, 2021 are:</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.item}>
                  <td>{fee.item}</td>
                  <td>{fee.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>No request fee is charged when you ask for your own personal information.</p>
      </>
    ),
  },
  {
    id: 'grounds',
    title: 'Grounds on which we may refuse',
    content: (
      <p>
        PAIA (Chapter 4 of Part 3) lets a private body refuse access where a record would
        unreasonably disclose another person&rsquo;s personal information, reveal trade secrets or
        confidential commercial information, breach a confidentiality obligation, endanger safety,
        be privileged in legal proceedings, or where the request is manifestly frivolous or
        vexatious. We will always tell you which ground applies.
      </p>
    ),
  },
  {
    id: 'complaints',
    title: 'Complaints to the Regulator',
    content: (
      <dl className={styles.facts}>
        <dt>Regulator</dt>
        <dd>{informationRegulator.name}</dd>
        <dt>Address</dt>
        <dd>{informationRegulator.address}</dd>
        <dt>PAIA complaints</dt>
        <dd>
          <a href={`mailto:${informationRegulator.paiaComplaintsEmail}`}>
            {informationRegulator.paiaComplaintsEmail}
          </a>
        </dd>
        <dt>POPIA complaints</dt>
        <dd>
          <a href={`mailto:${informationRegulator.complaintsEmail}`}>
            {informationRegulator.complaintsEmail}
          </a>
        </dd>
        <dt>Website</dt>
        <dd>
          <a href={informationRegulator.website} rel="noopener noreferrer" target="_blank">
            {informationRegulator.website}
          </a>
        </dd>
      </dl>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and updates',
    content: (
      <p>
        This manual is available on this website, and on request from the Information Officer by
        email or at our premises. It is reviewed at least annually and whenever our processing
        changes. Version {legalVersions.privacy}.
      </p>
    ),
  },
];

export default function PaiaManualPage(): React.JSX.Element {
  return (
    <LegalDocument
      kicker="PAIA section 51 · POPIA regulation 4"
      title="PAIA Manual"
      effectiveDate={legalVersions.privacy}
      lede={
        <>
          How to request access to records held by Alora, what it costs, how we decide, and a
          summary of how we process personal information. Every private body in South Africa must
          publish this manual.
        </>
      }
      sections={sections}
    />
  );
}
