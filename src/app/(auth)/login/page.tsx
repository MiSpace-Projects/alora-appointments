'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { easeInOut, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from '@/lib/auth-client';
import { authLogger } from '@/lib/auth-logger';
import { classifyAuthError } from '@/lib/auth-errors';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { AuthBackground } from '@/app/components/AuthBackground';
import { AuthCard, AuthHeader } from '@/app/components/authCard/AuthCard';
import { FormField } from '@/app/components/form/Form';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import { TabControl } from '@/app/components/AuthTabs/TabControl';
import { SocialAuthButtons } from '@/app/components/socialAuthButtons/SocialAuthButtons';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const raw = searchParams.get('callbackUrl') ?? '/';
  const destination = raw.startsWith('/') ? raw : '/';

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    setLoading(true);

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (result.error) {
        const classified = classifyAuthError(
          new Error(result.error.message ?? ''),
          result.error.code ?? result.error.status,
        );

        if (classified.category === 'UNKNOWN_USER') {
          authLogger.loginUnknownUser(data.email);
          toast.error('No account found with that email.', {
            description: 'Check the address or create a new account.',
            action: { label: 'Register', onClick: () => router.push('/register') },
          });
        } else {
          authLogger.loginFailure(data.email, classified.raw, classified.userMessage);
          toast.error(classified.userMessage);
        }
        return;
      }

      await refresh();
      authLogger.loginSuccess(result.data?.user?.id ?? 'unknown');
      toast.success('Welcome back!');
      router.push(destination);
    } catch (err) {
      const classified = classifyAuthError(err);

      if (classified.category === 'NETWORK') {
        authLogger.loginNetworkError(err instanceof Error ? err.message : undefined);
        toast.error('Connection problem.', {
          description: 'Check your internet connection and try again.',
        });
      } else {
        authLogger.loginFailure(
          data.email,
          classified.raw,
          err instanceof Error ? err.message : undefined,
        );
        toast.error(classified.userMessage);
      }
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
      content: (
        <>
          <div className={styles.headingBlock}>
            <h1 className={styles.title}>Create Account</h1>
            <p className={styles.subtitle}>Join Alora and start earning loyalty rewards</p>
          </div>
          <div className={styles.form}>
            <FormField type="text" placeholder="Full name" autoComplete="name" />
            <FormField type="email" placeholder="Email address" autoComplete="email" />
            <FormField type="password" placeholder="Password" autoComplete="new-password" />
            <div className={styles.submitArea}>
              <Link href="/register" style={{ textDecoration: 'none' }}>
                <SubmitButton>
                  Create account <ArrowRight size={15} />
                </SubmitButton>
              </Link>
            </div>
            <div className={styles.footer}>
              Already have an account?{' '}
              <Link href="/login" className={styles.footerLink}>
                Sign in
              </Link>
            </div>
          </div>
        </>
      ),
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
