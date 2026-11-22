'use client';

import { deleteTestimonialAction } from './actions';
import styles from './testimonials.module.css';

export function DeleteTestimonialButton({
  testimonialId,
  name,
}: {
  testimonialId: string;
  name: string;
}) {
  return (
    <form
      action={deleteTestimonialAction}
      onSubmit={(event) => {
        if (!window.confirm(`Permanently delete ${name}'s testimonial and its photos?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="testimonialId" value={testimonialId} />
      <button type="submit" className={styles.delete}>
        Delete
      </button>
    </form>
  );
}
