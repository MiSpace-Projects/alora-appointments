'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { easeInOut, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from '@/lib/auth-client';
import { classifyAuthError } from '@/lib/auth-errors';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { sanitizeRedirect } from '@/lib/safe-redirect';
import { AuthBackground } from '@/app/components/AuthBackground';
import { AuthCard, AuthHeader } from '@/app/components/authCard/AuthCard';
import { FormField } from '@/app/components/form/Form';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import { TabControl } from '@/app/components/AuthTabs/TabControl';
import { SocialAuthButtons } from '@/app/components/socialAuthButtons/SocialAuthButtons';
import { TurnstileWidget } from '@/app/components/TurnstileWidget';
import { useAuth } from '@/app/contexts/AuthContext';
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

function LoginInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const { refresh } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const destination = sanitizeRedirect(searchParams.get('callbackUrl'));

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    if (captchaRequired && !captchaToken) {
      toast.error('Complete the human verification before signing in.');
      return;
    }
    setLoading(true);

    try {
      sessionStorage.setItem('auth:callback', destination);
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        fetchOptions: captchaToken
          ? { headers: { 'x-captcha-response': captchaToken } }
          : undefined,
      });

      if (result.error) {
        const classified = classifyAuthError(
          new Error(result.error.message ?? ''),
          result.error.code ?? result.error.status,
        );

        // Never reveal whether the email exists. Collapse "no such user" and
        // "wrong password" into one generic message to prevent account
        // enumeration; the distinction is still recorded server-side for ops.
        const isCredentialError =
          classified.category === 'UNKNOWN_USER' || classified.category === 'INVALID_CREDENTIALS';

        toast.error(isCredentialError ? 'Invalid email or password.' : classified.userMessage);
        setCaptchaToken(null);
        setCaptchaResetKey((value) => value + 1);
        return;
      }

      toast.success('Welcome back!');
      window.location.replace(destination);
    } catch (err) {
      const classified = classifyAuthError(err);

      if (classified.category === 'NETWORK') {
        toast.error('Connection problem.', {
          description: 'Check your internet connection and try again.',
        });
      } else {
        toast.error(classified.userMessage);
      }
      setCaptchaToken(null);
      setCaptchaResetKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <motion.div variants={itemVariants}>
        <FormField
          type="email"
          placeholder="Email address"
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <FormField
          type="password"
          placeholder="Password"
          error={errors.password?.message}
          autoComplete="current-password"
          {...register('password')}
        />
      </motion.div>

      <motion.div variants={itemVariants} className={styles.formRow}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" className={styles.checkboxInput} {...register('rememberMe')} />
          <span className={styles.checkboxText}>Remember me</span>
        </label>
        <Link href="/forgot-password" className={styles.link}>
          Forgot password?
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className={styles.submitArea}>
        <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaResetKey} />
        <SubmitButton loading={loading}>
          Sign in <ArrowRight size={15} />
        </SubmitButton>
      </motion.div>

      {/* Issue #8: Social sign-in */}
      <SocialAuthButtons redirectTo={destination} onSuccess={refresh} />
    </form>
  );

  const registerPrompt = (
    <motion.p variants={itemVariants} className={styles.footer}>
      Don&apos;t have an account?{' '}
      <Link href="/register" className={styles.footerLink}>
        Create one
      </Link>
      {' · '}
      <Link href="/verify-email" className={styles.footerLink}>
        Resend verification
      </Link>
    </motion.p>
  );

  const tabs = [
    {
      id: 'signin',
      label: 'Sign in',
      content: (
        <>
          <div className={styles.headingBlock}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in to access your account</p>
          </div>
          {loginForm}
          {registerPrompt}
        </>
      ),
    },
    {
      id: 'signup',
      label: 'Sign up',
      href: '/register',
    },
  ];

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

              <TabControl tabs={tabs} defaultTab="signin" />
            </motion.div>
          </AuthCard>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
