import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { captcha, haveIBeenPwned, twoFactor } from 'better-auth/plugins';
import { prisma } from './prisma';
import {
  newDeviceEmail,
  passwordChangedEmail,
  sendAuthEmail,
  resetPasswordEmail,
  verificationEmail,
} from './email';
import { authRuntimeConfig, getTrustedOrigins, isCaptchaConfigured } from './auth-config';
import { hashPassword, verifyPassword } from './password';
import { authSignUpSchema } from './validation';
import { recordSecurityEvent, registerKnownDevice } from './security-events';

const HOUR_SECONDS = 60 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * HOUR_SECONDS;
const SESSION_FRESH_SECONDS = 10 * 60;
const EMAIL_VERIFICATION_TTL_SECONDS = 24 * HOUR_SECONDS;
const RESET_PASSWORD_TTL_SECONDS = HOUR_SECONDS;

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

const authPlugins = [
  haveIBeenPwned({
    customPasswordCompromisedMessage:
      'This password has appeared in a known data breach. Please choose a different one.',
  }),
  twoFactor({
    issuer: 'Alora',
    twoFactorCookieMaxAge: 5 * 60,
    trustDeviceMaxAge: 30 * 24 * HOUR_SECONDS,
    skipVerificationOnEnable: false,
    backupCodeOptions: {
      amount: 10,
      length: 12,
      storeBackupCodes: 'encrypted',
    },
    accountLockout: {
      enabled: true,
      maxFailedAttempts: 5,
      durationSeconds: 30 * 60,
    },
  }),
  ...(isCaptchaConfigured()
    ? [
        captcha({
          provider: 'cloudflare-turnstile',
          secretKey: authRuntimeConfig.captcha.secretKey,
          endpoints: [
            '/sign-up/email',
            '/sign-in/email',
            '/request-password-reset',
            '/send-verification-email',
          ],
          ...(authRuntimeConfig.captcha.allowedHostnames.length > 0
            ? { allowedHostnames: authRuntimeConfig.captcha.allowedHostnames }
            : {}),
        }),
      ]
    : []),
];

export const auth = betterAuth({
  appName: 'Alora',
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: authRuntimeConfig.baseUrl,
  secret: authRuntimeConfig.secret,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: false,
    minPasswordLength: 15,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: RESET_PASSWORD_TTL_SECONDS,
    revokeSessionsOnPasswordReset: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
    sendResetPassword: async ({ user, url }) => {
      const content = resetPasswordEmail(url);
      await sendAuthEmail({
        kind: 'PASSWORD_RESET',
        to: user.email,
        subject: 'Reset your Alora password',
        ...content,
        tags: ['authentication', 'password-reset'],
      });
    },
    onPasswordReset: async ({ user }, request) => {
      const content = passwordChangedEmail();
      await sendAuthEmail({
        kind: 'PASSWORD_CHANGED',
        to: user.email,
        subject: 'Your Alora password was changed',
        ...content,
        tags: ['authentication', 'security-notice'],
      });
      await recordSecurityEvent({
        event: 'PASSWORD_RESET_COMPLETED',
        outcome: 'SUCCESS',
        userId: user.id,
        userAgent: request?.headers.get('user-agent'),
      });
    },
    onExistingUserSignUp: async ({ user }, request) => {
      await recordSecurityEvent({
        event: 'DUPLICATE_SIGN_UP_ATTEMPT',
        outcome: 'BLOCKED',
        userId: user.id,
        userAgent: request?.headers.get('user-agent'),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    expiresIn: EMAIL_VERIFICATION_TTL_SECONDS,
    sendVerificationEmail: async ({ user, url }) => {
      const content = verificationEmail(url);
      await sendAuthEmail({
        kind: 'EMAIL_VERIFICATION',
        to: user.email,
        subject: 'Verify your Alora email',
        ...content,
        tags: ['authentication', 'email-verification'],
      });
    },
    afterEmailVerification: async (user, request) => {
      await recordSecurityEvent({
        event: 'EMAIL_VERIFIED',
        outcome: 'SUCCESS',
        userId: user.id,
        userAgent: request?.headers.get('user-agent'),
      });
    },
  },

  session: {
    expiresIn: SESSION_TTL_SECONDS,
    disableSessionRefresh: true,
    freshAge: SESSION_FRESH_SECONDS,
    cookieCache: { enabled: false },
  },

  verification: {
    storeIdentifier: 'hashed',
  },

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    ipAddress: {
      ipAddressHeaders: authRuntimeConfig.ipAddressHeaders,
      trustedProxies: authRuntimeConfig.trustedProxies,
      ipv6Subnet: 64,
    },
  },

  rateLimit: {
    enabled: true,
    storage: 'database',
    modelName: 'rateLimit',
    window: 60,
    max: 30,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60 * 60, max: 5 },
      '/request-password-reset': { window: 60 * 60, max: 5 },
      '/send-verification-email': { window: 60 * 60, max: 5 },
      '/reset-password': { window: 60 * 60, max: 10 },
      '/two-factor/*': { window: 10 * 60, max: 5 },
    },
  },

  trustedOrigins: getTrustedOrigins(),
  socialProviders,
  plugins: authPlugins,

  hooks: {
    before: createAuthMiddleware(async (context) => {
      if (context.path !== '/sign-up/email') return;
      const parsed = authSignUpSchema.safeParse(context.body);
      if (!parsed.success) {
        throw new APIError('BAD_REQUEST', {
          message: parsed.error.issues[0]?.message ?? 'Invalid account details',
        });
      }
      return {
        context: {
          ...context,
          body: {
            ...context.body,
            name: parsed.data.name,
            email: parsed.data.email,
            password: parsed.data.password,
          },
        },
      };
    }),
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await recordSecurityEvent({
            event: 'ACCOUNT_CREATED',
            outcome: 'SUCCESS',
            userId: user.id,
          });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          try {
            const isNewDevice = await registerKnownDevice({
              userId: session.userId,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            });
            await recordSecurityEvent({
              event: isNewDevice ? 'NEW_DEVICE_SIGN_IN' : 'SESSION_CREATED',
              outcome: 'SUCCESS',
              userId: session.userId,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            });

            if (isNewDevice) {
              const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: { email: true },
              });
              if (user) {
                const content = newDeviceEmail();
                await sendAuthEmail({
                  kind: 'NEW_DEVICE',
                  to: user.email,
                  subject: 'New sign-in to your Alora account',
                  ...content,
                  tags: ['authentication', 'security-notice'],
                });
              }
            }
          } catch (error) {
            console.error(
              JSON.stringify({
                level: 'error',
                service: 'auth',
                event: 'POST_SESSION_SECURITY_PROCESSING_FAILED',
                errorName: error instanceof Error ? error.name : 'UnknownError',
              }),
            );
            await recordSecurityEvent({
              event: 'POST_SESSION_SECURITY_PROCESSING_FAILED',
              outcome: 'FAILURE',
              userId: session.userId,
            });
          }
        },
      },
    },
  },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
