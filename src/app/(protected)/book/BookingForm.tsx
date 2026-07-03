'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { createBookingSchema, type CreateBookingInput } from '@/lib/validation';
import { formatZar } from '@/lib/format';
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

export function BookingForm({ services }: { services: ServiceOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // z.coerce.date makes the form's input type (datetime string) differ from the
  // parsed output (Date), so RHF needs both: <input, context, output>.
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.input<typeof createBookingSchema>, unknown, CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
  });

  const selectedId = useWatch({ control, name: 'serviceId' });
  const selected = services.find((s) => s.id === selectedId);

  const onSubmit = (data: CreateBookingInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createBookingAction(data);
      if (result.ok) {
        toast.success('Booking requested! We’ll confirm shortly.');
        router.push('/profile');
        router.refresh();
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/profile" className={styles.backLink}>
          <ArrowLeft size={14} /> Back to profile
        </Link>

        <h1 className={styles.title}>Book an appointment</h1>
        <p className={styles.subtitle}>Choose a service and a time that suits you.</p>

        {services.length === 0 ? (
          <p className={styles.emptyState}>
            Our booking menu is being updated. Please check back shortly.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="serviceId">
                Service
              </label>
              <select
                id="serviceId"
                className={styles.select}
                defaultValue=""
                {...register('serviceId')}
              >
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

            <div className={styles.field}>
              <label className={styles.label} htmlFor="notes">
                Notes <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <textarea
                id="notes"
                className={styles.textarea}
                placeholder="Anything we should know?"
                {...register('notes')}
              />
              {errors.notes && <span className={styles.error}>{errors.notes.message}</span>}
            </div>

            {serverError && <span className={styles.error}>{serverError}</span>}

            <SubmitButton loading={isPending}>Confirm booking</SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
