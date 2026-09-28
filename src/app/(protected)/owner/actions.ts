'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireOwner } from '@/lib/owner';
import { cancelBookingAsOwner, completeBooking, confirmBooking } from '@/lib/data/bookings';
import { SERVICES_CACHE_TAG } from '@/lib/data/services';
import { notifyCustomerBookingConfirmed } from '@/lib/notifications';
import { formatDateTime } from '@/lib/format';

function bookingId(formData: FormData): string {
  const id = formData.get('bookingId');
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('BOOKING_NOT_FOUND');
  }
  return id;
}

export async function confirmBookingAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = bookingId(formData);
  const booking = await confirmBooking(id);
  revalidatePath('/owner');
  revalidatePath('/profile');

  if (booking?.user?.email) {
    try {
      await notifyCustomerBookingConfirmed(booking.user.email, {
        customerName: booking.user.name ?? '',
        serviceName: booking.service.name,
        when: formatDateTime(booking.startsAt),
      });
    } catch (error) {
      console.error(
        '[owner] confirmation email failed:',
        error instanceof Error ? error.message : error,
      );
    }
  }
}

export async function completeBookingAction(formData: FormData): Promise<void> {
  await requireOwner();
  await completeBooking(bookingId(formData));
  revalidatePath('/owner');
  revalidatePath('/profile');
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  await requireOwner();
  await cancelBookingAsOwner(bookingId(formData));
  revalidatePath('/owner');
  revalidatePath('/profile');
}

export async function refreshCatalogAction(): Promise<void> {
  await requireOwner();
  updateTag(SERVICES_CACHE_TAG);
  revalidatePath('/');
  revalidatePath('/services');
  revalidatePath('/book');
}
