import type { Metadata } from 'next';
import Link from 'next/link';
import { routes } from '@/app/config/routes';
import {
  businessContact,
  businessLegal,
  cancellationPolicy,
  legalVersions,
} from '@/app/config/business';
import { Fact, LegalDocument, type LegalSection } from '../LegalDocument';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Terms & Booking Policy',
  description:
    'The terms that apply when you book, pay for, cancel or reschedule an appointment with Alora, including the disclosures required by ECTA section 43.',
  alternates: { canonical: routes.terms.path },
};

const lateRefundPercent = Math.round(cancellationPolicy.lateRefundFraction * 100);

const sections: LegalSection[] = [
  {
    id: 'who',
    title: 'Who you are dealing with',
    content: (
      <>
        <p>
          Section 43 of the Electronic Communications and Transactions Act 25 of 2002
          (&ldquo;ECTA&rdquo;) requires us to tell you who we are before you transact online.
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
          <dt>Registration number</dt>
          <dd>
            <Fact
              value={businessLegal.registrationNumber}
              label="Not applicable / to be confirmed"
            />
          </dd>
          <dt>VAT number</dt>
          <dd>
            <Fact value={businessLegal.vatNumber} label="Not VAT registered / to be confirmed" />
          </dd>
          <dt>Physical address</dt>
          <dd>
            <Fact value={businessLegal.physicalAddress} label="Street address to be confirmed" />,{' '}
            {businessContact.location}, {businessContact.country}
          </dd>
          <dt>Telephone</dt>
          <dd>
            <a href={`tel:${businessContact.phoneE164}`}>{businessContact.phoneDisplay}</a>
          </dd>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${businessContact.email}`}>{businessContact.email}</a>
          </dd>
          <dt>Website</dt>
          <dd>{businessContact.website}</dd>
          <dt>Address for legal notices</dt>
          <dd>The physical address above, or the email address above.</dd>
          <dt>Industry bodies / codes</dt>
          <dd>We are not currently a member of a self-regulatory or accreditation body.</dd>
        </dl>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Your account',
    content: (
      <ul>
        <li>
          You must be 18 or older to open an account. A parent or guardian books on behalf of anyone
          younger.
        </li>
        <li>
          Give us accurate details and keep them up to date; we send confirmations and reminders to
          the email on your account.
        </li>
        <li>
          Keep your password private. Turn on two-factor authentication in your profile for extra
          protection. You are responsible for bookings made from your account until you tell us it
          has been compromised.
        </li>
        <li>
          You may close your account at any time from your profile. See the{' '}
          <Link href={routes.privacy.path}>Privacy Policy</Link> for what we keep afterwards and
          why.
        </li>
      </ul>
    ),
  },
  {
    id: 'booking',
    title: 'Booking an appointment',
    content: (
      <>
        <ol>
          <li>
            <strong>Choose</strong> a service and a date and time. The description, duration and
            full price of each service are shown before you choose it.
          </li>
          <li>
            <strong>Review</strong> your booking summary. You can go back and correct anything
            before you confirm (ECTA s43(2)).
          </li>
          <li>
            <strong>Confirm</strong>, choosing to pay now or at the salon. Your booking is created
            as <em>pending</em>.
          </li>
          <li>
            <strong>We confirm.</strong> A booking is <em>confirmed</em> when we accept it (or
            immediately when you pay online). Until then no agreement exists and we may decline a
            request, for example if the slot is no longer available.
          </li>
        </ol>
        <p>
          You will receive an email for each booking, which together with your profile page is the
          record of the transaction (ECTA s43(1)(m)). Please arrive on time; if you are more than 15
          minutes late we may have to shorten or reschedule the service.
        </p>
      </>
    ),
  },
  {
    id: 'prices',
    title: 'Prices and payment',
    content: (
      <>
        <ul>
          <li>
            All prices are in South African Rand and are the full price you pay. There are no
            booking, delivery or card fees on top.{' '}
            <Fact
              value={businessLegal.vatNumber ? 'Prices include VAT.' : null}
              label="VAT status to be confirmed by the owner"
            />
          </li>
          <li>
            <strong>Pay now:</strong> online by card, instant EFT or other methods offered by our
            payment processor, Paystack. You enter your details on Paystack&rsquo;s secure, PCI DSS
            compliant page; we never see your card number. Paying online confirms your booking
            immediately.
          </li>
          <li>
            <strong>Pay at the salon:</strong> settle the full price when you arrive, by the methods
            available in the salon on the day.
          </li>
          <li>
            The price shown when you book is the price you pay, even if our menu changes later.
          </li>
          <li>
            We use a payment system that is sufficiently secure by current technological standards
            (ECTA s43(5)). If a payment fails, your booking stays pending and unpaid; you can retry
            from your profile.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Cancellations, rescheduling and refunds',
    content: (
      <>
        <div className={styles.callout}>
          <p>
            <strong>Cancel {cancellationPolicy.fullRefundHours} hours or more before</strong> your
            appointment: full refund of anything you paid online, no questions asked.
          </p>
          <p>
            <strong>Cancel inside {cancellationPolicy.fullRefundHours} hours:</strong>{' '}
            {lateRefundPercent}% of the amount paid is refunded; the rest covers the slot we can no
            longer fill.
          </p>
          <p>
            <strong>No-show</strong> (you do not arrive and did not cancel): no refund.
          </p>
        </div>
        <ul>
          <li>
            You cancel from your profile page; the refund is calculated automatically from the time
            you cancel and shown to you before you confirm.
          </li>
          <li>
            Refunds go back to the original payment method and are processed within{' '}
            {cancellationPolicy.refundProcessingDays} working days (the law allows up to 30 days;
            ECTA s44(3)). Your bank may take a few further days to show it.
          </li>
          <li>
            <strong>Rescheduling:</strong> contact us to move your appointment. A reschedule
            requested {cancellationPolicy.fullRefundHours} hours or more before the slot is free;
            inside that window it counts as a cancellation and rebooking.
          </li>
          <li>
            <strong>If we cancel</strong> (illness, load-shedding, emergency), you get a full refund
            or a new slot, your choice, and we will tell you as early as we can.
          </li>
          <li>
            <strong>Cooling-off.</strong> ECTA gives online consumers a seven-day cooling-off
            period, but section 42(2)(i) excludes services that the supplier agrees to provide on a
            specific date. Because every appointment is for a specific date and time, the
            cooling-off period does not apply to bookings; the policy above applies instead. You
            still have every right the Consumer Protection Act 68 of 2008 gives you.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'loyalty',
    title: 'Loyalty points',
    content: (
      <ul>
        <li>
          Each service shows the points it earns. Points are added when the appointment is
          completed, not when it is booked.
        </li>
        <li>Cancelled or no-show bookings earn no points.</li>
        <li>
          Points have no cash value, cannot be transferred, and are removed if an account is closed.
          We may change the programme with 30 days&rsquo; notice by email; points already earned
          keep their value until then.
        </li>
      </ul>
    ),
  },
  {
    id: 'conduct',
    title: 'In the salon',
    content: (
      <p>
        We may refuse or end a service, without refund, if a client is abusive to staff or other
        clients, arrives under the influence, or asks for something unsafe. Tell us about allergies,
        sensitivities or medical conditions that could affect a treatment before it starts; we may
        ask you to sign a consent for chemical services.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Our responsibility to you',
    content: (
      <>
        <p>
          We provide services with reasonable skill and care, as the Consumer Protection Act
          requires. If a service is not performed to that standard, tell us within 10 days and we
          will put it right, redo it or refund it (CPA s54).
        </p>
        <p>
          Nothing in these terms limits liability that the law does not allow us to limit, including
          for gross negligence or death or injury caused by our fault. Beyond that, we are not
          liable for indirect or consequential loss, and our liability for any booking is limited to
          the price of that booking.
        </p>
      </>
    ),
  },
  {
    id: 'complaints',
    title: 'Complaints and disputes',
    content: (
      <>
        <p>
          Contact us first at{' '}
          <a href={`mailto:${businessContact.email}`}>{businessContact.email}</a> or{' '}
          <a href={`tel:${businessContact.phoneE164}`}>{businessContact.phoneDisplay}</a>. We
          acknowledge complaints within 2 working days and aim to resolve them within 10.
        </p>
        <p>
          If we cannot resolve it, you may approach the Consumer Goods and Services Ombud
          (www.cgso.org.za), the National Consumer Commission, or the courts of South Africa.
          Nothing here stops you using any dispute process the CPA gives you.
        </p>
      </>
    ),
  },
  {
    id: 'privacy',
    title: 'Privacy',
    content: (
      <p>
        How we handle your personal information is set out in our{' '}
        <Link href={routes.privacy.path}>Privacy Policy</Link> and{' '}
        <Link href={routes.cookies.path}>Cookie Policy</Link>, which form part of these terms.
      </p>
    ),
  },
  {
    id: 'general',
    title: 'General',
    content: (
      <ul>
        <li>These terms are governed by the law of the Republic of South Africa.</li>
        <li>
          We may update these terms; the version and effective date at the top always show the
          current one. Changes apply to bookings made after the change. We will email account
          holders about material changes.
        </li>
        <li>If any part of these terms is found unenforceable, the rest still applies.</li>
        <li>An electronic record of the version you accepted is kept with your account.</li>
      </ul>
    ),
  },
];

export default function TermsPage(): React.JSX.Element {
  return (
    <LegalDocument
      kicker="Terms of service · ECTA s43 disclosures"
      title="Terms & Booking Policy"
      effectiveDate={legalVersions.terms}
      lede={
        <>
          These are the terms that apply when you use this website to book, pay for, change or
          cancel an appointment with Alora. They include the information we must give you under the
          Electronic Communications and Transactions Act and the Consumer Protection Act. Please
          read them; you accept them when you create an account or make a booking.
        </>
      }
      sections={sections}
    />
  );
}
