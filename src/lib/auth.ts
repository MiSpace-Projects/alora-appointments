import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { haveIBeenPwned } from 'better-auth/plugins';
import { prisma } from './prisma';
import { sendEmail, verificationEmail, resetPasswordEmail } from './email';

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
      const sent = await sendEmail({
        to: user.email,
        subject: 'Reset your Alora password',
        html: resetPasswordEmail(url),
      });
      // If it couldn't be delivered (no key / send error), surface the link in
      // the server log so local development isn't blocked.
      if (sent) console.log(`[AUTH] Password reset email sent to ${user.email}`);
      else console.log(`[AUTH] Password reset URL for ${user.email}: ${url}`);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const sent = await sendEmail({
        to: user.email,
        subject: 'Verify your Alora email',
        html: verificationEmail(url),
      });
      if (sent) console.log(`[AUTH] Verification email sent to ${user.email}`);
      else console.log(`[AUTH] Email verification URL for ${user.email}: ${url}`);
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

  advanced: {
    // Force the `Secure` attribute on session cookies in production regardless
    // of how BETTER_AUTH_URL is written, so a misconfigured (http) URL can never
    // downgrade cookie security on a deployed environment.
    useSecureCookies: process.env.NODE_ENV === 'production',
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

  plugins: [
    // NIST 800-63B: reject passwords known to be compromised. Checks sign-up,
    // reset and change-password against the HaveIBeenPwned range API using
    // k-anonymity (only a hash prefix leaves the server), enforced server-side
    // so it can't be bypassed by a crafted client request.
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        'This password has appeared in a known data breach. Please choose a different one.',
    }),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
