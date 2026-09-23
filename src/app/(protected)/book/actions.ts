'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { createBooking } from '@/lib/data/bookings';
import { createBookingSchema } from '@/lib/validation';

export type BookingActionResult = { ok: true } | { ok: false; error: string };

const ERROR_COPY: Record<string, string> = {
  SERVICE_NOT_AVAILABLE: 'That service is no longer available.',
  SLOT_ALREADY_BOOKED: 'You already have a booking at that time.',
};

/**
 * Server action for creating a booking. Re-authorizes and re-validates on the
 * server — the client form's checks are UX only and are never trusted here.
 */
export async function createBookingAction(input: unknown): Promise<BookingActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: 'You must be signed in to book.' };
  }

  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  try {
    await createBooking(session.user.id, parsed.data);
    revalidatePath('/profile');
    return { ok: true };
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN';
    return {
      ok: false,
      error: ERROR_COPY[code] ?? 'Could not create the booking. Please try again.',
    };
  }
}
