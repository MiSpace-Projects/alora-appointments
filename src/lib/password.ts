import { hash, type Options, verify } from '@node-rs/argon2';
import { verifyPassword as verifyLegacyScrypt } from 'better-auth/crypto';
import { prisma } from './prisma';

export const ARGON2_OPTIONS: Options = {
  algorithm: 2,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword({
  hash: storedHash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  if (storedHash.startsWith('$argon2id$')) {
    return verify(storedHash, password, ARGON2_OPTIONS);
  }

  const validLegacyPassword = await verifyLegacyScrypt({ hash: storedHash, password });
  if (!validLegacyPassword) return false;

  const upgradedHash = await hashPassword(password);
  await prisma.account.updateMany({
    where: { providerId: 'credential', password: storedHash },
    data: { password: upgradedHash },
  });
  return true;
}
