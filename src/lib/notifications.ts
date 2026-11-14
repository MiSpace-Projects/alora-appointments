import 'server-only';
import { parseOwnerAllowlist } from './owner-core';
import {
  bookingCancelledCustomerEmail,
  bookingConfirmedCustomerEmail,
  newBookingOwnerEmail,
  sendAuthEmail,
  type BookingEmailDetails,
} from './email';

export async function notifyOwnerOfNewBooking(details: BookingEmailDetails): Promise<void> {
  const owners = parseOwnerAllowlist(process.env.ALORA_OWNER_EMAILS);
  if (owners.length === 0) {
    console.warn('[notifications] ALORA_OWNER_EMAILS is empty, new booking alert not sent.');
    return;
  }
  const { html, text } = newBookingOwnerEmail(details);
  await Promise.all(
    owners.map((to) =>
      sendAuthEmail({
        kind: 'BOOKING_CREATED_OWNER',
        to,
        subject: `New booking: ${details.serviceName}`,
        html,
        text,
      }),
    ),
  );
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

export async function notifyCustomerBookingCancelled(
  to: string,
  details: {
    customerName: string;
    serviceName: string;
    when: string;
    cancelledBy: 'customer' | 'salon';
    refund: string | null;
  },
): Promise<void> {
  const { html, text } = bookingCancelledCustomerEmail(details);
  await sendAuthEmail({
    kind: 'BOOKING_CANCELLED_CUSTOMER',
    to,
    subject: 'Your Alora booking was cancelled',
    html,
    text,
  });
}
