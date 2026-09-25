'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { createBookingSchema, type CreateBookingInput } from '@/lib/validation';
import { formatBookingDate, formatBookingTime, formatZar } from '@/lib/format';
import { routes } from '@/app/config/routes';
import { cancellationPolicy } from '@/app/config/business';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import { createBookingAction } from './actions';
import styles from './book.module.css';

export interface ServiceOption {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
  pointsAwarded: number;
}

interface BookingFormProps {
  services: ServiceOption[];
  /** Service to preselect (from `/book?service=<slug>`); must be one of `services`. */
  preselectedServiceId?: string;
  /** Whether the "pay now" option is offered (gateway configured server-side). */
  onlinePaymentAvailable: boolean;
}

type FormInput = z.input<typeof createBookingSchema>;

/**
 * Two-step booking: details → review → confirm. The review step lets the
 * customer check and correct everything before placing the order, which ECTA
 * s43(2) requires for online transactions.
 */
export function BookingForm({
  services,
  preselectedServiceId,
  onlinePaymentAvailable,
}: BookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'review'>('details');
  const [reviewed, setReviewed] = useState<CreateBookingInput | null>(null);

  // z.coerce.date makes the form's input type (datetime string) differ from the
  // parsed output (Date), so RHF needs both: <input, context, output>.
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      serviceId: preselectedServiceId ?? '',
      paymentMethod: onlinePaymentAvailable ? 'PAY_NOW' : 'PAY_IN_SALON',
    },
  });

  const selectedId = useWatch({ control, name: 'serviceId' });
  const selected = services.find((s) => s.id === selectedId);

  const goToReview = (data: CreateBookingInput) => {
    setServerError(null);
    setReviewed(data);
    setStep('review');
  };

  const confirm = () => {
    if (!reviewed) return;
    setServerError(null);
    startTransition(async () => {
      const result = await createBookingAction(reviewed);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      if (result.redirectUrl) {
        toast.message('Taking you to secure payment…');
        window.location.assign(result.redirectUrl);
        return;
      }
      toast.success('Booking requested! We’ll confirm shortly.');
      router.push(routes.myProfile.path);
      router.refresh();
    });
  };

  const reviewedService = reviewed && services.find((s) => s.id === reviewed.serviceId);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <h1 className={styles.title}>
          {step === 'details' ? 'Book an appointment' : 'Review your booking'}
        </h1>
        <p className={styles.subtitle}>
          {step === 'details'
            ? 'Choose a service, a time, and how you would like to pay.'
            : 'Check the details below. You can go back and change anything before confirming.'}
        </p>

        {services.length === 0 ? (
          <p className={styles.emptyState}>
            Our booking menu is being updated. Please check back shortly.
          </p>
        ) : step === 'details' ? (
          <form onSubmit={handleSubmit(goToReview)} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="serviceId">
                Service
              </label>
              <select id="serviceId" className={styles.select} {...register('serviceId')}>
                <option value="" disabled>
                  Select a service
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {formatZar(s.priceCents)}
                  </option>
                ))}
              </select>
              {errors.serviceId && <span className={styles.error}>{errors.serviceId.message}</span>}
            </div>

            {selected && (
              <div className={styles.summary}>
                <span>
                  {selected.durationMinutes} min · +{selected.pointsAwarded} points
                </span>
                <span className={styles.summaryPrice}>{formatZar(selected.priceCents)}</span>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="startsAt">
                Date &amp; time
              </label>
              <input
                id="startsAt"
                type="datetime-local"
                className={styles.input}
                {...register('startsAt')}
              />
              {errors.startsAt && <span className={styles.error}>{errors.startsAt.message}</span>}
            </div>

            <fieldset className={styles.field}>
              <legend className={styles.label}>Payment</legend>
              <div className={styles.choiceGroup}>
                {onlinePaymentAvailable && (
                  <label className={styles.choice}>
                    <input type="radio" value="PAY_NOW" {...register('paymentMethod')} />
                    <span>
                      <span className={styles.choiceTitle}>Pay now</span>
                      <span className={styles.choiceHint}>
                        Card or instant EFT on Paystack&rsquo;s secure page. Confirms your slot
                        immediately. Full refund if you cancel at least{' '}
                        {cancellationPolicy.fullRefundHours} hours before.
                      </span>
                    </span>
                  </label>
                )}
                <label className={styles.choice}>
                  <input type="radio" value="PAY_IN_SALON" {...register('paymentMethod')} />
                  <span>
                    <span className={styles.choiceTitle}>Pay at the salon</span>
                    <span className={styles.choiceHint}>
                      Settle the full price when you arrive. We confirm the slot by email.
                    </span>
                  </span>
                </label>
              </div>
              {errors.paymentMethod && (
                <span className={styles.error}>{errors.paymentMethod.message}</span>
              )}
            </fieldset>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="notes">
                Notes <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="notes"
                className={styles.textarea}
                placeholder="Anything we should know?"
                {...register('notes')}
              />
              {errors.notes && <span className={styles.error}>{errors.notes.message}</span>}
            </div>

            <SubmitButton>Review booking</SubmitButton>
          </form>
        ) : (
          reviewed &&
          reviewedService && (
            <div className={styles.form}>
              <dl className={styles.review}>
                <div className={styles.reviewRow}>
                  <dt>Service</dt>
                  <dd>{reviewedService.name}</dd>
                </div>
                <div className={styles.reviewRow}>
                  <dt>When</dt>
                  <dd>
                    {formatBookingDate(reviewed.startsAt)} · {formatBookingTime(reviewed.startsAt)}
                  </dd>
                </div>
                <div className={styles.reviewRow}>
                  <dt>Duration</dt>
                  <dd>{reviewedService.durationMinutes} min</dd>
                </div>
                <div className={styles.reviewRow}>
                  <dt>Loyalty</dt>
                  <dd>+{reviewedService.pointsAwarded} points on completion</dd>
                </div>
                <div className={styles.reviewRow}>
                  <dt>Payment</dt>
                  <dd>
                    {reviewed.paymentMethod === 'PAY_NOW' ? 'Pay now (Paystack)' : 'At the salon'}
                  </dd>
                </div>
                {reviewed.notes && (
                  <div className={styles.reviewRow}>
                    <dt>Notes</dt>
                    <dd>{reviewed.notes}</dd>
                  </div>
                )}
                <div className={`${styles.reviewRow} ${styles.reviewTotal}`}>
                  <dt>Total</dt>
                  <dd>{formatZar(reviewedService.priceCents)}</dd>
                </div>
              </dl>

              <p className={styles.legalNote}>
                By confirming you accept the{' '}
                <Link href={routes.terms.path} target="_blank">
                  Terms &amp; Booking Policy
                </Link>
                , including the cancellation rules: full refund {cancellationPolicy.fullRefundHours}
                h or more before, {Math.round(cancellationPolicy.lateRefundFraction * 100)}% inside{' '}
                {cancellationPolicy.fullRefundHours}h, none for no-shows.
              </p>

              {serverError && <span className={styles.error}>{serverError}</span>}

              <SubmitButton type="button" loading={isPending} onClick={confirm}>
                {reviewed.paymentMethod === 'PAY_NOW'
                  ? `Confirm & pay ${formatZar(reviewedService.priceCents)}`
                  : 'Confirm booking'}
              </SubmitButton>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={isPending}
                onClick={() => setStep('details')}
              >
                Back and edit
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}
