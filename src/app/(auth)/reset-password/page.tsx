'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { AuthBackground } from '@/app/components/AuthBackground';
import { AuthCard, AuthHeader } from '@/app/components/authCard/AuthCard';
import { FormField } from '@/app/components/form/Form';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import styles from '../shared.module.css';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      router.push('/forgot-password');
    }
  }, [token, router]);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) return;

    setLoading(true);

    try {
      await authClient.resetPassword({
        newPassword: data.password,
        token: token,
      });

      setResetSuccess(true);
      toast.success('Password reset successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
      console.error('Reset password error:', error);
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
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AuthHeader />

              {resetSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.successBlock}
                >
                  <CheckCircle2 size={40} className={styles.successIcon} />
                  <h1 className={styles.successTitle}>Password Reset!</h1>
                  <p className={styles.successBody}>
                    Your password has been successfully reset. Redirecting you to login...
                  </p>
                  <Link href="/login" className={styles.backLink}>
                    <ArrowLeft size={13} />
                    Back to sign in
                  </Link>
                </motion.div>
              ) : (
                <>
                  <div className={styles.headingBlock}>
                    <h1 className={styles.title}>Create New Password</h1>
                    <p className={styles.subtitle}>Enter your new password below</p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <FormField
                      type="password"
                      placeholder="New password"
                      error={errors.password?.message}
                      autoComplete="new-password"
                      {...register('password')}
                    />

                    <FormField
                      type="password"
                      placeholder="Confirm new password"
                      error={errors.confirmPassword?.message}
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                    />

                    <div className={styles.submitArea}>
                      <SubmitButton loading={loading}>Reset Password</SubmitButton>
                    </div>
                  </form>

                  <p className={styles.footer}>
                    <Link href="/login" className={styles.backLink}>
                      <ArrowLeft size={12} />
                      Back to sign in
                    </Link>
                  </p>
                </>
              )}
            </motion.div>
          </AuthCard>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
