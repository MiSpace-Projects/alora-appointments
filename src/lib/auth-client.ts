import { createAuthClient } from 'better-auth/react';

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

if (!baseURL && process.env.NODE_ENV === 'production') {
  throw new Error(
    '[auth-client] NEXT_PUBLIC_BETTER_AUTH_URL is not set. ' +
      'Add it to your environment variables before deploying.',
  );
}

export const authClient = createAuthClient({
  baseURL: baseURL ?? 'http://localhost:3000',
});

export const { useSession, getSession, signIn, signOut, signUp } = authClient;
