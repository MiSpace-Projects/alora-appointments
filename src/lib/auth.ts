import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_REFRESH_SECONDS = 60 * 60 * 24;
const COOKIE_CACHE_SECONDS = 60 * 5;

const socialProviders = {
  ...(process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
    }),
  ...(process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    }),
  ...(process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_CLIENT_SECRET && {
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
      },
    }),
  ...(process.env.DISCORD_CLIENT_ID &&
    process.env.DISCORD_CLIENT_SECRET && {
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
      },
    }),
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      if (!process.env.RESEND_API_KEY) {
        console.error('[AUTH] RESEND_API_KEY not configured');
        console.log(`[AUTH] Password reset URL for ${user.email}: ${url}`);
        return;
      }

      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: 'Alora <onboarding@resend.dev>',
          to: user.email,
          subject: 'Reset your Alora password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d4c5b0;">Reset Your Password</h2>
              <p>Click the link below to reset your password. This link expires in 1 hour.</p>
              <a href="${url}" style="background: #d4c5b0; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              <p>Or copy this link: ${url}</p>
              <p>If you didn't request this, ignore this email.</p>
            </div>
          `,
        });

        console.log(`[AUTH] Password reset email sent to ${user.email}`);
      } catch (error) {
        console.error('[AUTH] Failed to send password reset email:', error);

        console.log(`[AUTH] Password reset URL for ${user.email}: ${url}`);
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Make sure RESEND_API_KEY is set in your .env
      if (!process.env.RESEND_API_KEY) {
        console.error('[AUTH] RESEND_API_KEY not configured');
        console.log(`[AUTH] Email verification URL for ${user.email}: ${url}`);
        return;
      }

      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: 'Alora <onboarding@resend.dev>',
          to: user.email,
          subject: 'Verify your Alora email',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d4c5b0;">Welcome to Alora!</h2>
              <p>Please verify your email address to start using your account.</p>
              <a href="${url}" style="background: #d4c5b0; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
              <p>Or copy this link: ${url}</p>
              <p>This link expires in 24 hours.</p>
              <p>If you didn't create an account, ignore this email.</p>
            </div>
          `,
        });

        console.log(`[AUTH] Verification email sent to ${user.email}`);
      } catch (error) {
        console.error('[AUTH] Failed to send verification email:', error);
        console.log(`[AUTH] Email verification URL for ${user.email}: ${url}`);
      }
    },
  },

  session: {
    expiresIn: SESSION_TTL_SECONDS,
    updateAge: SESSION_REFRESH_SECONDS,
    cookieCache: {
      enabled: true,
      maxAge: COOKIE_CACHE_SECONDS,
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    'http://localhost:3000',
  ]
    .filter(Boolean)
    .map((origin) => origin as string) as string[],

  socialProviders,
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
