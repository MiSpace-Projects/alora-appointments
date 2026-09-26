'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentSession } from '@/lib/session';
import { createBooking } from '@/lib/data/bookings';
import { startBookingPayment } from '@/lib/data/payments';
import { PaystackError } from '@/lib/payments/paystack';
import { isOnlinePaymentAvailable } from '@/lib/payments/provider';
import { createBookingSchema } from '@/lib/validation';
import { businessContact } from '@/app/config/business';

export type BookingActionResult =
  | { ok: true; redirectUrl?: string; bookingId: string }
  | { ok: false; error: string };

const ERROR_COPY: Record<string, string> = {
  SERVICE_NOT_AVAILABLE: 'That service is no longer available.',
  SLOT_ALREADY_BOOKED: 'You already have a booking at that time.',
  BOOKING_NOT_FOUND: 'We could not find that booking.',
  BOOKING_NOT_PAYABLE: 'That booking can no longer be paid online.',
  BOOKING_ALREADY_PAID: 'That booking has already been paid.',
  PAYMENTS_UNAVAILABLE: 'Online payment is not available right now. You can pay at the salon.',
};

function paymentReturnUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? businessContact.website;
  return `${base.replace(/\/$/, '')}/book/payment`;
}

/**
 * Server action for creating a booking. Re-authorizes and re-validates on the
 * server — the client form's checks are UX only and are never trusted here.
 * For "pay now" the booking is created first (so a closed tab never loses it)
 * and the Paystack checkout URL is returned for the browser to navigate to.
 */
export async function createBookingAction(input: unknown): Promise<BookingActionResult> {
  const session = await getCurrentSession();
  if (!session) {
    return { ok: false, error: 'You must be signed in to book.' };
  }

  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  if (parsed.data.paymentMethod === 'PAY_NOW' && !isOnlinePaymentAvailable()) {
    return { ok: false, error: ERROR_COPY.PAYMENTS_UNAVAILABLE };
  }

  let bookingId: string;
  try {
    const booking = await createBooking(session.user.id, parsed.data);
    bookingId = booking.id;
    revalidatePath('/profile');
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN';
    return {
      ok: false,
      error: ERROR_COPY[code] ?? 'Could not create the booking. Please try again.',
    };
  }

  if (parsed.data.paymentMethod === 'PAY_IN_SALON') {
    return { ok: true, bookingId };
  }

  try {
    const { authorizationUrl } = await startBookingPayment(
      session.user.id,
      session.user.email,
      bookingId,
      paymentReturnUrl(),
    );
    return { ok: true, bookingId, redirectUrl: authorizationUrl };
  } catch (err) {
    // The booking exists and is unpaid; the profile offers a retry.
    const code = err instanceof PaystackError ? 'PAYMENTS_UNAVAILABLE' : errorCode(err);
    return {
      ok: false,
      error: `${ERROR_COPY[code] ?? 'Could not start the payment.'} Your booking was saved as unpaid; you can pay from your profile.`,
    };
  }
}

/** Start (or resume) online payment for one of the user's own unpaid bookings. */
export async function startPaymentAction(bookingId: unknown): Promise<BookingActionResult> {
  const session = await getCurrentSession();
  if (!session) {
    return { ok: false, error: 'You must be signed in.' };
  }
  if (typeof bookingId !== 'string' || bookingId.length === 0) {
    return { ok: false, error: ERROR_COPY.BOOKING_NOT_FOUND };
  }
  if (!isOnlinePaymentAvailable()) {
    return { ok: false, error: ERROR_COPY.PAYMENTS_UNAVAILABLE };
  }

  try {
    const { authorizationUrl } = await startBookingPayment(
      session.user.id,
      session.user.email,
      bookingId,
      paymentReturnUrl(),
    );
    return { ok: true, bookingId, redirectUrl: authorizationUrl };
  } catch (err) {
    const code = err instanceof PaystackError ? 'PAYMENTS_UNAVAILABLE' : errorCode(err);
    return { ok: false, error: ERROR_COPY[code] ?? 'Could not start the payment.' };
  }
}

function errorCode(err: unknown): string {
  return err instanceof Error ? err.message : 'UNKNOWN';
}
