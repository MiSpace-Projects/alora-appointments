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
import { TurnstileWidget } from '@/app/components/TurnstileWidget';
import styles from './page.module.css';

function PasswordStrength({ password }: { password: string }) {
  const checks = [{ label: '15+ characters', met: password.length >= 15 }];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={styles.strengthWrap}
    >
      <div className={styles.strengthBar}>
        <div
          className={`${styles.strengthSegment} ${password.length >= 15 ? styles.strengthMet : ''}`}
        />
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const {
    register,
    handleSubmit,
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
    const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    if (captchaRequired && !captchaToken) {
      toast.error('Complete the human verification before creating an account.');
      return;
    }
    setLoading(true);

    try {
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        fetchOptions: captchaToken
          ? { headers: { 'x-captcha-response': captchaToken } }
          : undefined,
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Failed to create account.');
        setCaptchaToken(null);
        setCaptchaResetKey((value) => value + 1);
        return;
      }

      // Auto-sign-in remains off. Verification is optional and can be completed later.
      toast.success('Account created. You can sign in now and verify your email later.');
      router.push('/login');
    } catch {
      toast.error('Something went wrong.');
      setCaptchaToken(null);
      setCaptchaResetKey((value) => value + 1);
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
        <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaResetKey} />
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
      href: '/login',
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
