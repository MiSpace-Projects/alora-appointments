import { requireSession } from '@/lib/session';
import { listUserBookings } from '@/lib/data/bookings';
import { getUserLoyalty } from '@/lib/data/loyalty';
import { ProfileView } from './ProfileView';
import { isOnlinePaymentAvailable } from '@/lib/payments/provider';

/**
 * Server component: resolves the session and loads the user's real bookings and
 * loyalty standing through the DAL, then hands them to the animated client view.
 * The (protected) layout already gates auth; the check here narrows the type and
 * is defence in depth.
 */
export default async function ProfilePage() {
  const session = await requireSession();

  const [bookings, loyalty] = await Promise.all([
    listUserBookings(session.user.id),
    getUserLoyalty(session.user.id),
  ]);

  // Explicit DTO: only what the view needs crosses the RSC boundary, never the
  // whole session.user. (twoFactorEnabled is a better-auth plugin field that
  // isn't in the inferred user type, so it's read through a narrow cast.)
  const { name, email, marketingOptIn } = session.user;
  const twoFactorEnabled = (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled;

  return (
    <ProfileView
      user={{ name, email, twoFactorEnabled, marketingOptIn }}
      bookings={bookings}
      loyalty={loyalty}
      onlinePaymentAvailable={isOnlinePaymentAvailable()}
    />
  );
}
