'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/owner';
import {
  addTestimonialPhoto,
  assertPhotoSlot,
  deleteTestimonial,
  removeTestimonialPhoto,
  setTestimonialVisibility,
  TestimonialActionError,
} from '@/lib/data/testimonials-owner';
import { PhotoRejectedError, preparePhoto } from '@/lib/testimonial-photo-core';
import {
  deleteStoredPhotos,
  isPhotoStorageConfigured,
  storePhoto,
} from '@/lib/testimonial-photo-storage';

export type PhotoUploadResult = { ok: true } | { ok: false; message: string };

function requiredId(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) {
    throw new TestimonialActionError('Missing testimonial.');
  }
  return value;
}

function refresh(): void {
  revalidatePath('/owner/testimonials');
  revalidatePath('/');
}

export async function uploadTestimonialPhotoAction(formData: FormData): Promise<PhotoUploadResult> {
  await requireOwner();
  try {
    if (!isPhotoStorageConfigured()) {
      return { ok: false, message: 'Photo storage is not connected yet.' };
    }
    const testimonialId = requiredId(formData, 'testimonialId');
    const file = formData.get('photo');
    if (!(file instanceof File)) return { ok: false, message: 'Choose a photo to upload.' };

    await assertPhotoSlot(testimonialId);
    const prepared = await preparePhoto(Buffer.from(await file.arrayBuffer()));
    const stored = await storePhoto(testimonialId, prepared);
    try {
      await addTestimonialPhoto(testimonialId, {
        ...stored,
        width: prepared.width,
        height: prepared.height,
      });
    } catch (error) {
      await deleteStoredPhotos([stored.url]);
      throw error;
    }
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof PhotoRejectedError || error instanceof TestimonialActionError) {
      return { ok: false, message: error.message };
    }
    console.error('[testimonials] upload failed:', error instanceof Error ? error.message : error);
    return { ok: false, message: 'Upload failed. Please try again.' };
  }
}

export async function removeTestimonialPhotoAction(formData: FormData): Promise<void> {
  await requireOwner();
  const url = await removeTestimonialPhoto(requiredId(formData, 'photoId'));
  if (url) await deleteStoredPhotos([url]);
  refresh();
}

export async function publishTestimonialAction(formData: FormData): Promise<void> {
  await requireOwner();
  await setTestimonialVisibility(requiredId(formData, 'testimonialId'), 'PUBLISHED');
  refresh();
}

export async function hideTestimonialAction(formData: FormData): Promise<void> {
  await requireOwner();
  await setTestimonialVisibility(requiredId(formData, 'testimonialId'), 'HIDDEN');
  refresh();
}

export async function deleteTestimonialAction(formData: FormData): Promise<void> {
  await requireOwner();
  const urls = await deleteTestimonial(requiredId(formData, 'testimonialId'));
  await deleteStoredPhotos(urls);
  refresh();
}
