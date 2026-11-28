import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthBackground } from '@/app/components/AuthBackground';
import { AuthCard, AuthHeader } from '@/app/components/authCard/AuthCard';
import { loginWithCallback, sanitizeRedirect } from '@/lib/safe-redirect';
import { getCurrentSession } from '@/lib/session';
import { WelcomeForm } from './WelcomeForm';
import shared from '../shared.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Finish signing up' };

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function WelcomePage({ searchParams }: PageProps) {
  const next = sanitizeRedirect((await searchParams).next);
  const session = await getCurrentSession();
  if (!session) redirect(loginWithCallback(`/welcome?next=${encodeURIComponent(next)}`));
  if (session.user.termsAccepted) redirect(next);

  const firstName = session.user.name.trim().split(/\s+/)[0];

  return (
    <>
      <AuthBackground />
      <div className={shared.page}>
        <div className={shared.cardWrap}>
          <AuthCard>
            <AuthHeader />
            <div className={shared.headingBlock}>
              <h1 className={shared.title}>{firstName ? `Welcome, ${firstName}` : 'Welcome'}</h1>
              <p className={shared.subtitle}>
                One last step before you book and start earning loyalty points.
              </p>
            </div>
            <WelcomeForm next={next} />
          </AuthCard>
        </div>
      </div>
    </>
  );
}
