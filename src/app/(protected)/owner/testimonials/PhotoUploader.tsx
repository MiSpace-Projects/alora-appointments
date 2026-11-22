'use client';

import { useRef, useState, useTransition } from 'react';
import { TESTIMONIAL_MAX_PHOTOS } from '@/lib/testimonial-core';
import { uploadTestimonialPhotoAction } from './actions';
import styles from './testimonials.module.css';

const CLIENT_MAX_EDGE = 2000;

async function shrinkForUpload(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }
  const scale = Math.min(1, CLIENT_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9),
  );
  return blob ?? file;
}

export function PhotoUploader({
  testimonialId,
  photoCount,
}: {
  testimonialId: string;
  photoCount: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const remaining = TESTIMONIAL_MAX_PHOTOS - photoCount;

  function handleFiles(files: FileList | null): void {
    if (!files || files.length === 0) return;
    const selected = Array.from(files).slice(0, remaining);
    setError(
      files.length > remaining
        ? `Only ${remaining} more photo${remaining === 1 ? '' : 's'} can be added.`
        : null,
    );
    startTransition(async () => {
      for (const [index, file] of selected.entries()) {
        setProgress(`Uploading ${index + 1} of ${selected.length}…`);
        const formData = new FormData();
        formData.set('testimonialId', testimonialId);
        formData.set('photo', await shrinkForUpload(file), 'photo.jpg');
        const result = await uploadTestimonialPhotoAction(formData);
        if (!result.ok) {
          setError(result.message);
          break;
        }
      }
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  if (remaining <= 0) {
    return <p className={styles.hint}>Photo limit reached ({TESTIMONIAL_MAX_PHOTOS}).</p>;
  }

  return (
    <div className={styles.uploader}>
      <label className={styles.uploadButton} aria-disabled={pending || undefined}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={pending}
          className={styles.srOnly}
          onChange={(event) => handleFiles(event.target.files)}
        />
        {pending ? 'Uploading…' : 'Add photos'}
      </label>
      <span className={styles.hint} aria-live="polite">
        {progress ?? `${remaining} of ${TESTIMONIAL_MAX_PHOTOS} left`}
      </span>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
