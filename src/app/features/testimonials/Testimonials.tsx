import Image from 'next/image';
import type { PublishedTestimonial } from '@/lib/data/testimonials-public';
import styles from './Testimonials.module.css';

function TestimonialCard({ testimonial }: { testimonial: PublishedTestimonial }) {
  const [photo, ...more] = testimonial.photos;
  return (
    <li className={styles.card}>
      {photo && (
        <div className={styles.photo}>
          <Image
            src={photo.url}
            alt={`${testimonial.displayName}'s ${testimonial.serviceName} at Alora Studios`}
            fill
            sizes="(max-width: 768px) 80vw, 360px"
            className={styles.photoImg}
            unoptimized
          />
          {more.length > 0 && (
            <span className={styles.more} aria-hidden="true">
              +{more.length}
            </span>
          )}
        </div>
      )}
      <figure className={styles.body}>
        <p className={styles.stars} aria-label={`${testimonial.rating} out of 5 stars`}>
          {'★'.repeat(testimonial.rating)}
        </p>
        <blockquote className={styles.quote}>
          <p>{testimonial.body}</p>
        </blockquote>
        <figcaption className={styles.caption}>
          <span className={styles.name}>{testimonial.displayName}</span>
          <span className={styles.service}>{testimonial.serviceName}</span>
        </figcaption>
      </figure>
    </li>
  );
}

export function Testimonials({ testimonials }: { testimonials: PublishedTestimonial[] }) {
  if (testimonials.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="testimonials-title">
      <header className={styles.header}>
        <span className={styles.kicker}>Testimonials</span>
        <h2 id="testimonials-title" className={styles.title}>
          In their words
        </h2>
      </header>
      <ul className={styles.list}>
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </ul>
    </section>
  );
}
