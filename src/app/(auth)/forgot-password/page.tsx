'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence, easeInOut } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation';
import { AuthBackground } from '@/app/components/AuthBackground';
import { AuthCard, AuthHeader } from '@/app/components/authCard/AuthCard';
import { FormField } from '@/app/components/form/Form';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import styles from '../shared.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeInOut },
  },
};

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset email');
      }

      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
      console.error('Forgot password error:', error);
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
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants}>
                <AuthHeader />
              </motion.div>

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="success"
                    className={styles.successBlock}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: easeInOut }}
                  >
                    <CheckCircle2 size={40} className={styles.successIcon} />
                    <h1 className={styles.successTitle}>Check your inbox</h1>
                    <p className={styles.successBody}>
                      We&apos;ve sent a reset link to{' '}
                      <span className={styles.successEmail}>{getValues('email')}</span>. It expires
                      in 1 hour.
                    </p>
                    <Link href="/login" className={styles.backLink}>
                      <ArrowLeft size={13} />
                      Back to sign in
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={styles.headingBlock}>
                      <h1 className={styles.title}>Reset password</h1>
                      <p className={styles.subtitle}>
                        Enter your email and we&apos;ll send a reset link
                      </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                      <FormField
                        type="email"
                        placeholder="Email address"
                        error={errors.email?.message}
                        autoComplete="email"
                        {...register('email')}
                      />

                      <div className={styles.submitArea}>
                        <SubmitButton loading={loading}>
                          Send reset link <ArrowRight size={15} />
                        </SubmitButton>
                      </div>
                    </form>

                    <p className={styles.footer}>
                      <Link href="/login" className={styles.backLink}>
                        <ArrowLeft size={12} />
                        Back to sign in
                      </Link>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AuthCard>
        </div>
      </div>
    </>
  );
}
