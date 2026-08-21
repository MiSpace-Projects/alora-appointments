import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  plugins: [twoFactorClient({ twoFactorPage: '/two-factor' })],
});

export const { useSession, getSession, signIn, signOut, signUp } = authClient;
