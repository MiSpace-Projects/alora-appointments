import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { listUserBookings } from '@/lib/data/bookings';
import { getUserLoyalty } from '@/lib/data/loyalty';
import { ProfileView } from './ProfileView';

/**
 * Server component: resolves the session and loads the user's real bookings and
 * loyalty standing through the DAL, then hands them to the animated client view.
 * The (protected) layout already gates auth; the check here narrows the type and
 * is defence in depth.
 */
export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect('/login');
  }

  const [bookings, loyalty] = await Promise.all([
    listUserBookings(session.user.id),
    getUserLoyalty(session.user.id),
  ]);

  return <ProfileView user={session.user} bookings={bookings} loyalty={loyalty} />;
}
