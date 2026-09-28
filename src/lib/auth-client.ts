import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields, twoFactorClient } from 'better-auth/client/plugins';
import type { auth } from './auth';

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient({ twoFactorPage: '/two-factor' }),
  ],
});

export const { useSession, getSession, signIn, signOut, signUp } = authClient;
