import { requireSession } from '@/lib/session';
import { isOwnerSession } from '@/lib/owner';
import { listUserBookings } from '@/lib/data/bookings';
import { getUserLoyalty } from '@/lib/data/loyalty';
import { ProfileView } from './ProfileView';
import { isOnlinePaymentAvailable } from '@/lib/payments/provider';

export default async function ProfilePage() {
  const session = await requireSession();

  const [bookings, loyalty] = await Promise.all([
    listUserBookings(session.user.id),
    getUserLoyalty(session.user.id),
  ]);

  const { name, email, marketingOptIn } = session.user;
  const twoFactorEnabled = (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled;

  return (
    <ProfileView
      user={{ name, email, twoFactorEnabled, marketingOptIn }}
      bookings={bookings}
      loyalty={loyalty}
      onlinePaymentAvailable={isOnlinePaymentAvailable()}
      isOwner={isOwnerSession(session)}
    />
  );
}
