'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import { routes } from '@/app/config/routes';
import { acceptTermsAction, type WelcomeFormState } from './actions';
import shared from '../shared.module.css';

export function WelcomeForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<WelcomeFormState, FormData>(
    acceptTermsAction.bind(null, next),
    {},
  );

  return (
    <form action={formAction} className={shared.form}>
      <div className={shared.consentBlock}>
        <label className={shared.checkboxLabel}>
          <input
            type="checkbox"
            name="termsAccepted"
            className={shared.checkboxInput}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? 'terms-error' : undefined}
          />
          <span className={shared.checkboxText}>
            I have read and accept the{' '}
            <Link href={routes.terms.path} className={shared.inlineLink} target="_blank">
              Terms &amp; Booking Policy
            </Link>{' '}
            and the{' '}
            <Link href={routes.privacy.path} className={shared.inlineLink} target="_blank">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {state.error && (
          <span id="terms-error" className={shared.fieldError} role="alert">
            {state.error}
          </span>
        )}
        <label className={shared.checkboxLabel}>
          <input type="checkbox" name="marketingOptIn" className={shared.checkboxInput} />
          <span className={shared.checkboxText}>
            Email me about offers and new services (optional; unsubscribe any time).
          </span>
        </label>
      </div>
      <SubmitButton loading={pending}>
        Continue <ArrowRight size={15} />
      </SubmitButton>
    </form>
  );
}
