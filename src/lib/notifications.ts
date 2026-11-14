import 'server-only';
import { prisma } from '@/lib/prisma';
import { formatPrice } from './format';
import { parseOwnerAllowlist } from './owner-core';
import { sendAuthEmail, type AuthEmailKind } from './email';
import {
  bookingCancelledCustomerEmail,
  bookingConfirmedCustomerEmail,
  bookingReceivedCustomerEmail,
  newBookingOwnerEmail,
  type BookingEmail,
  type BookingEmailContext,
} from './booking-emails';

export async function loadBookingEmailContext(
  bookingId: string,
): Promise<BookingEmailContext | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      startsAt: true,
      priceCents: true,
      paymentMethod: true,
      paidAt: true,
      notes: true,
      user: { select: { name: true, email: true } },
      service: {
        select: {
          name: true,
          slug: true,
          durationMinutes: true,
          priceType: true,
          priceMaxCents: true,
        },
      },
    },
  });
  if (!booking?.user) return null;
  return {
    bookingId: booking.id,
    customerName: booking.user.name,
    customerEmail: booking.user.email,
    serviceName: booking.service.name,
    serviceSlug: booking.service.slug,
    startsAt: booking.startsAt,
    durationMinutes: booking.service.durationMinutes,
    price: formatPrice({
      priceCents: booking.priceCents,
      priceType: booking.service.priceType,
      priceMaxCents: booking.service.priceMaxCents,
    }),
    paymentMethod: booking.paymentMethod,
    paid: booking.paidAt !== null,
    notes: booking.notes,
  };
}

async function send(kind: AuthEmailKind, to: string, email: BookingEmail): Promise<void> {
  await sendAuthEmail({
    kind,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: email.attachments,
  });
}

export async function notifyOwnerOfNewBooking(bookingId: string): Promise<void> {
  const owners = parseOwnerAllowlist(process.env.ALORA_OWNER_EMAILS);
  if (owners.length === 0) {
    console.warn('[notifications] ALORA_OWNER_EMAILS is empty, new booking alert not sent.');
    return;
  }
  const context = await loadBookingEmailContext(bookingId);
  if (!context) return;
  const email = newBookingOwnerEmail(context);
  await Promise.all(owners.map((to) => send('BOOKING_CREATED_OWNER', to, email)));
}

export async function notifyCustomerBookingReceived(bookingId: string): Promise<void> {
  const context = await loadBookingEmailContext(bookingId);
  if (!context) return;
  await send(
    'BOOKING_RECEIVED_CUSTOMER',
    context.customerEmail,
    bookingReceivedCustomerEmail(context),
  );
}

export async function notifyCustomerBookingConfirmed(bookingId: string): Promise<void> {
  const context = await loadBookingEmailContext(bookingId);
  if (!context) return;
  await send(
    'BOOKING_CONFIRMED_CUSTOMER',
    context.customerEmail,
    bookingConfirmedCustomerEmail(context),
  );
}

export async function notifyCustomerBookingCancelled(
  bookingId: string,
  details: { cancelledBy: 'customer' | 'salon'; refund: string | null },
): Promise<void> {
  const context = await loadBookingEmailContext(bookingId);
  if (!context) return;
  await send(
    'BOOKING_CANCELLED_CUSTOMER',
    context.customerEmail,
    bookingCancelledCustomerEmail(context, details),
  );
}
