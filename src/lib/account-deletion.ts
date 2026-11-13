export type DeletionRequirement = 'ALLOWED' | 'PASSWORD_REQUIRED' | 'REAUTHENTICATE';

export interface DeletionRequestInput {
  hasPassword: boolean;
  passwordProvided: boolean;
  tokenProvided: boolean;
  sessionCreatedAt: Date | string;
  now: number;
  freshAgeSeconds: number;
}

interface AccountLike {
  providerId: string;
  password?: string | null;
}

export const DELETE_PASSWORD_REQUIRED_MESSAGE =
  'Enter your current password to delete your account.';
export const DELETE_REAUTHENTICATE_MESSAGE =
  'For your security, sign in again, then delete your account.';

export function hasCredentialPassword(accounts: AccountLike[]): boolean {
  return accounts.some((account) => account.providerId === 'credential' && !!account.password);
}

export function isSessionFresh(
  sessionCreatedAt: Date | string,
  now: number,
  freshAgeSeconds: number,
): boolean {
  const createdAt = new Date(sessionCreatedAt).getTime();
  if (Number.isNaN(createdAt)) return false;
  return now - createdAt < freshAgeSeconds * 1_000;
}

export function deletionRequirement(input: DeletionRequestInput): DeletionRequirement {
  if (input.tokenProvided) return 'ALLOWED';
  if (input.hasPassword) return input.passwordProvided ? 'ALLOWED' : 'PASSWORD_REQUIRED';
  return isSessionFresh(input.sessionCreatedAt, input.now, input.freshAgeSeconds)
    ? 'ALLOWED'
    : 'REAUTHENTICATE';
}
