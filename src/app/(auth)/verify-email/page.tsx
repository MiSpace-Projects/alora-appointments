'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation';
import { AuthBackground } from '@/app/components/AuthBackground';
import { AuthCard, AuthHeader } from '@/app/components/authCard/AuthCard';
import { FormField } from '@/app/components/form/Form';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import { TurnstileWidget } from '@/app/components/TurnstileWidget';
import styles from '../shared.module.css';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      toast.error('Complete the human verification before continuing.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: data.email,
        callbackURL: '/login',
        fetchOptions: captchaToken
          ? { headers: { 'x-captcha-response': captchaToken } }
          : undefined,
      });

      if (error) throw new Error(error.message ?? 'The request could not be completed.');
      setComplete(true);
      toast.success('Verification request accepted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The request could not be completed.');
      setCaptchaToken(null);
      setCaptchaResetKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthBackground />
      <div className={styles.page}>
        <div className={styles.cardWrap}>
          <AuthCard>
            <AuthHeader />
            <div className={styles.headingBlock}>
              <h1 className={styles.title}>Verify your email</h1>
              <p className={styles.subtitle}>
                {complete
                  ? 'If the account is eligible, verification instructions will arrive by email.'
                  : 'Request a new verification email for your account.'}
              </p>
            </div>
            {!complete && (
              <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <FormField
                  type="email"
                  placeholder="Email address"
                  error={errors.email?.message}
                  autoComplete="email"
                  {...register('email')}
                />
                <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaResetKey} />
                <SubmitButton loading={loading}>Send verification email</SubmitButton>
              </form>
            )}
            <p className={styles.footer}>
              <Link href="/login" className={styles.backLink}>
                <ArrowLeft size={12} />
                Back to sign in
              </Link>
            </p>
          </AuthCard>
        </div>
      </div>
    </>
  );
}
