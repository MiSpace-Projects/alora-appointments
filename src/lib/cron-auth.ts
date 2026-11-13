import { createHash, timingSafeEqual } from 'node:crypto';

const MIN_SECRET_LENGTH = 16;

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function isAuthorizedCronRequest(
  authorization: string | null | undefined,
  secret: string | null | undefined,
): boolean {
  if (!secret || secret.trim().length < MIN_SECRET_LENGTH) return false;
  if (!authorization) return false;
  const expected = digest(`Bearer ${secret}`);
  const received = digest(authorization);
  return timingSafeEqual(expected, received);
}
