import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

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
  ...(process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET && {
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      },
    }),
  ...(process.env.TWITTER_CLIENT_ID &&
    process.env.TWITTER_CLIENT_SECRET && {
      twitter: {
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
      },
    }),
  ...(process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET && {
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      },
    }),
};

const ExpiryDays = 60 * 60 * 24 * 7;
const RefreshLimit = 60 * 60 * 24;
const ClientSideCache = 60 * 5;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: ExpiryDays,
    updateAge: RefreshLimit,
    cookieCache: {
      enabled: true,
      maxAge: ClientSideCache,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
  advanced: {
    database: {
      generateId: false,
    },
  },
  socialProviders,
});

export type Auth = typeof auth;
