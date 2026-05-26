'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { signUp } from '@/lib/auth-client';
import { registerSchema, type RegisterInput } from '@/lib/validation';
import { AuthBackground } from '@/app/components/AuthBackground';
import { AuthCard, AuthHeader } from '@/app/components/authCard/AuthCard';
import { FormField } from '@/app/components/form/Form';
import { SubmitButton } from '@/app/components/submitButton/SubmitButton';
import { TabControl } from '@/app/components/AuthTabs/TabControl';
import styles from './page.module.css';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];
  const strength = checks.filter((c) => c.met).length;

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={styles.strengthWrap}
    >
      <div className={styles.strengthBar}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={styles.strengthSegment}
            style={{ background: i < strength ? '#d4c5b0' : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>

      <div className={styles.strengthChecks}>
        {checks.map((check) => (
          <span key={check.label} className={check.met ? styles.checkMet : styles.checkUnmet}>
            <CheckCircle2 size={10} />
            {check.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = useWatch({
    control,
    name: 'password',
    defaultValue: '',
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);

    try {
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Failed to create account.');
        return;
      }

      toast.success('Account created! Welcome aboard.');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const registerForm = (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <FormField
        type="text"
        placeholder="Full name"
        error={errors.name?.message}
        autoComplete="name"
        {...register('name')}
      />

      <FormField
        type="email"
        placeholder="Email address"
        error={errors.email?.message}
        autoComplete="email"
        {...register('email')}
      />

      <div>
        <FormField
          type="password"
          placeholder="Password"
          error={errors.password?.message}
          autoComplete="new-password"
          {...register('password')}
        />
        <AnimatePresence>{password && <PasswordStrength password={password} />}</AnimatePresence>
      </div>

      <FormField
        type="password"
        placeholder="Confirm password"
        error={errors.confirmPassword?.message}
        autoComplete="new-password"
        {...register('confirmPassword')}
      />

      <div className={styles.submitArea}>
        <SubmitButton loading={loading}>
          Create account <ArrowRight size={15} />
        </SubmitButton>
      </div>
    </form>
  );

  const loginPrompt = (
    <div className={styles.footer}>
      Already have an account?{' '}
      <Link href="/login" className={styles.footerLink}>
        Sign in
      </Link>
    </div>
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
          <div className={styles.form}>
            <FormField type="email" placeholder="Email address" autoComplete="email" />
            <FormField type="password" placeholder="Password" autoComplete="current-password" />
            <div className={styles.submitArea}>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <SubmitButton>
                  Sign in <ArrowRight size={15} />
                </SubmitButton>
              </Link>
            </div>
            <div className={styles.footer}>
              Don&apos;t have an account?
              <Link href="/register" className={styles.footerLink}>
                Create one
              </Link>
            </div>
          </div>
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
          {registerForm}
          {loginPrompt}
        </>
      ),
    },
  ];

  return (
    <>
      <AuthBackground />

      <div className={styles.page}>
        <div className={styles.heroSection}>
          <div className={styles.authPanel}>
            <AuthCard>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <AuthHeader />
                <TabControl tabs={tabs} defaultTab="signup" />
              </motion.div>
            </AuthCard>
          </div>
        </div>
      </div>
    </>
  );
}
