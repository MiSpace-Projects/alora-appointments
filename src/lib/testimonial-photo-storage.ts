import 'server-only';
import { del, put } from '@vercel/blob';
import type { PreparedPhoto } from './testimonial-photo-core';

export function isPhotoStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function storePhoto(
  testimonialId: string,
  photo: PreparedPhoto,
): Promise<{ url: string; pathname: string }> {
  const result = await put(`testimonials/${testimonialId}/photo.jpg`, photo.data, {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: true,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return { url: result.url, pathname: result.pathname };
}

export async function deleteStoredPhotos(urls: string[]): Promise<void> {
  if (urls.length === 0 || !isPhotoStorageConfigured()) return;
  try {
    await del(urls);
  } catch (error) {
    console.error(
      '[testimonials] photo cleanup failed:',
      error instanceof Error ? error.message : error,
    );
  }
}
