import type { Metadata } from 'next';
import Image from 'next/image';
import { requireOwner } from '@/lib/owner';
import { listOwnerTestimonials, type OwnerTestimonial } from '@/lib/data/testimonials-owner';
import { isPhotoStorageConfigured } from '@/lib/testimonial-photo-storage';
import { formatDateTime } from '@/lib/format';
import { OwnerTabs } from '../OwnerTabs';
import { DeleteTestimonialButton } from './DeleteTestimonialButton';
import { PhotoUploader } from './PhotoUploader';
import {
  hideTestimonialAction,
  publishTestimonialAction,
  removeTestimonialPhotoAction,
} from './actions';
import ownerStyles from '../owner.module.css';
import styles from './testimonials.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Testimonials',
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<OwnerTestimonial['status'], string> = {
  INVITED: 'Invited',
  SUBMITTED: 'Awaiting review',
  PUBLISHED: 'Live on site',
  HIDDEN: 'Hidden',
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
      <span className={styles.starsOff}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

function TestimonialCard({
  testimonial,
  storageReady,
}: {
  testimonial: OwnerTestimonial;
  storageReady: boolean;
}) {
  const name = testimonial.displayName ?? 'Customer';
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <Stars rating={testimonial.rating ?? 0} />
          <p className={styles.service}>
            {testimonial.booking.service.name} · {formatDateTime(testimonial.booking.startsAt)}
          </p>
        </div>
        <span className={`${styles.status} ${styles[`status_${testimonial.status}`]}`}>
          {STATUS_LABEL[testimonial.status]}
        </span>
      </div>

      <blockquote className={styles.quote}>
        <p>{testimonial.body}</p>
        <footer>
          {name}
          {testimonial.user && testimonial.user.name !== name ? ` (${testimonial.user.name})` : ''}
        </footer>
      </blockquote>

      {testimonial.photos.length > 0 && (
        <ul className={styles.photos}>
          {testimonial.photos.map((photo) => (
            <li key={photo.id} className={styles.photo}>
              <Image
                src={photo.url}
                alt={`Photo for ${name}'s testimonial`}
                width={photo.width}
                height={photo.height}
                sizes="160px"
                unoptimized
              />
              <form action={removeTestimonialPhotoAction}>
                <input type="hidden" name="photoId" value={photo.id} />
                <button type="submit" className={styles.removePhoto} aria-label="Remove photo">
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.cardActions}>
        {storageReady ? (
          <PhotoUploader testimonialId={testimonial.id} photoCount={testimonial.photos.length} />
        ) : (
          <p className={styles.hint}>Photo uploads switch on once photo storage is connected.</p>
        )}
        <div className={styles.buttons}>
          {testimonial.status !== 'PUBLISHED' ? (
            <form action={publishTestimonialAction}>
              <input type="hidden" name="testimonialId" value={testimonial.id} />
              <button type="submit" className={styles.publish}>
                Publish
              </button>
            </form>
          ) : (
            <form action={hideTestimonialAction}>
              <input type="hidden" name="testimonialId" value={testimonial.id} />
              <button type="submit" className={styles.hide}>
                Hide
              </button>
            </form>
          )}
          <DeleteTestimonialButton testimonialId={testimonial.id} name={name} />
        </div>
      </div>
    </li>
  );
}

export default async function OwnerTestimonialsPage() {
  await requireOwner();
  const testimonials = await listOwnerTestimonials();
  const storageReady = isPhotoStorageConfigured();
  const awaiting = testimonials.filter((item) => item.status === 'SUBMITTED').length;
  const live = testimonials.filter((item) => item.status === 'PUBLISHED').length;

  return (
    <main className={ownerStyles.page}>
      <OwnerTabs active="testimonials" />
      <header className={ownerStyles.head}>
        <div>
          <h1 className={ownerStyles.title}>Testimonials</h1>
          <p className={ownerStyles.subtitle}>
            {testimonials.length === 0
              ? 'Nothing yet.'
              : `${awaiting} awaiting review · ${live} live on the site`}
          </p>
        </div>
      </header>
      {testimonials.length === 0 ? (
        <p className={ownerStyles.empty}>
          When you mark a booking done, the customer gets an email asking for a testimonial. Their
          words land here for you to add photos and publish.
        </p>
      ) : (
        <ul className={styles.list}>
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              storageReady={storageReady}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
