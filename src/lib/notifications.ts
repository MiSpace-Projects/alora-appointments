import 'server-only';
import { businessContact } from '@/app/config/business';
import {
  bookingConfirmedCustomerEmail,
  newBookingOwnerEmail,
  sendAuthEmail,
  type BookingEmailDetails,
} from './email';

export async function notifyOwnerOfNewBooking(details: BookingEmailDetails): Promise<void> {
  const { html, text } = newBookingOwnerEmail(details);
  await sendAuthEmail({
    kind: 'BOOKING_CREATED_OWNER',
    to: businessContact.email,
    subject: `New booking: ${details.serviceName}`,
    html,
    text,
  });
}

export async function notifyCustomerBookingConfirmed(
  to: string,
  details: { customerName: string; serviceName: string; when: string },
): Promise<void> {
  const { html, text } = bookingConfirmedCustomerEmail(details);
  await sendAuthEmail({
    kind: 'BOOKING_CONFIRMED_CUSTOMER',
    to,
    subject: 'Your Alora booking is confirmed',
    html,
    text,
  });
}
