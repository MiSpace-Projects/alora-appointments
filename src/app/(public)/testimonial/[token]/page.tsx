import type { Metadata } from 'next';
import Link from 'next/link';
import { businessContact } from '@/app/config/business';
import { getTestimonialInvite } from '@/lib/data/testimonials';
import { TestimonialForm } from './TestimonialForm';
import styles from './testimonial.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Your testimonial',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const visitDate = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface PageProps {
  params: Promise<{ token: string }>;
}

function Closed({ title, body }: { title: string; body: string }) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Testimonial</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lead}>{body}</p>
        <Link href="/" className={styles.homeLink}>
          Back to Alora
        </Link>
      </section>
    </main>
  );
}

export default async function TestimonialPage({ params }: PageProps) {
  const { token } = await params;
  const invite = await getTestimonialInvite(token);

  if (!invite) {
    return (
      <Closed
        title="This link is not valid."
        body="Check that you opened the full link from your Alora email."
      />
    );
  }
  if (invite.state === 'SUBMITTED') {
    return (
      <Closed
        title={`Thank you, ${invite.customerFirstName}.`}
        body="We already have your testimonial for this visit."
      />
    );
  }
  if (invite.state === 'EXPIRED') {
    return (
      <Closed
        title="This link has expired."
        body={`Testimonial links work for 30 days. If you would still like to share your experience, email ${businessContact.email}.`}
      />
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Testimonial</p>
        <h1 className={styles.title}>How was your {invite.serviceName}?</h1>
        <p className={styles.lead}>
          Your visit on {visitDate.format(invite.visitedAt)}. A few words help other clients find
          us, and help us keep getting better.
        </p>
        <TestimonialForm token={token} firstName={invite.customerFirstName} />
      </section>
    </main>
  );
}
