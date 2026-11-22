'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { TESTIMONIAL_BODY_MAX } from '@/lib/testimonial-core';
import { submitTestimonialAction, type TestimonialFormState } from './actions';
import styles from './testimonial.module.css';

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Loved it'];

export function TestimonialForm({ token, firstName }: { token: string; firstName: string }) {
  const [state, formAction, pending] = useActionState<TestimonialFormState, FormData>(
    submitTestimonialAction.bind(null, token),
    { status: 'idle' },
  );
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [nameStyle, setNameStyle] = useState<'first' | 'full'>('first');
  const [consent, setConsent] = useState(false);
  const doneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (state.status !== 'submitted') return;
    doneRef.current?.focus({ preventScroll: true });
    doneRef.current?.scrollIntoView({ block: 'center' });
  }, [state.status]);

  if (state.status === 'submitted') {
    return (
      <div ref={doneRef} tabIndex={-1} className={styles.done} role="status">
        <p className={styles.doneTitle}>Thank you, {firstName}.</p>
        <p>
          Your testimonial is with the Alora team. Once it is approved it may appear on our site
          with photos of your look.
        </p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <fieldset
        className={styles.field}
        aria-describedby={errors.rating ? 'rating-error' : undefined}
      >
        <legend className={styles.label}>Your rating</legend>
        <div className={styles.stars}>
          {RATING_LABELS.map((label, index) => {
            const value = index + 1;
            return (
              <label key={value} className={styles.star} data-active={value <= rating || undefined}>
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className={styles.srOnly}
                />
                <span aria-hidden="true">★</span>
                <span className={styles.srOnly}>
                  {value} star{value === 1 ? '' : 's'}, {label}
                </span>
              </label>
            );
          })}
          <span className={styles.ratingLabel} aria-hidden="true">
            {rating ? RATING_LABELS[rating - 1] : ''}
          </span>
        </div>
        {errors.rating && (
          <p id="rating-error" className={styles.error}>
            {errors.rating}
          </p>
        )}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="body" className={styles.label}>
          Your experience
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          maxLength={TESTIMONIAL_BODY_MAX}
          className={styles.textarea}
          placeholder="What did you love about your visit?"
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? 'body-error body-count' : 'body-count'}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <p id="body-count" className={styles.hint}>
          {body.length} / {TESTIMONIAL_BODY_MAX}
        </p>
        {errors.body && (
          <p id="body-error" className={styles.error}>
            {errors.body}
          </p>
        )}
      </div>

      <fieldset className={styles.field}>
        <legend className={styles.label}>Show my name as</legend>
        <div className={styles.choices}>
          <label className={styles.choice}>
            <input
              type="radio"
              name="nameStyle"
              value="first"
              checked={nameStyle === 'first'}
              onChange={() => setNameStyle('first')}
            />
            First name only
          </label>
          <label className={styles.choice}>
            <input
              type="radio"
              name="nameStyle"
              value="full"
              checked={nameStyle === 'full'}
              onChange={() => setNameStyle('full')}
            />
            Full name
          </label>
        </div>
        {errors.nameStyle && <p className={styles.error}>{errors.nameStyle}</p>}
      </fieldset>

      <label className={styles.consent}>
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          aria-invalid={errors.consent ? true : undefined}
        />
        <span>
          I agree that Alora Studios may publish this testimonial on its website with my chosen name
          and photos of my look taken at the salon. I can ask for it to be removed at any time.
        </span>
      </label>
      {errors.consent && <p className={styles.error}>{errors.consent}</p>}

      {state.status === 'error' && state.message && (
        <p className={styles.formError} role="alert">
          {state.message}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? 'Sending…' : 'Send testimonial'}
      </button>
    </form>
  );
}
