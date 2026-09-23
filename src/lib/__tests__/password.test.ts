const updateMany = jest.fn().mockResolvedValue({ count: 1 });
const mockVerifyLegacyScrypt = jest.fn();

jest.mock('better-auth/crypto', () => ({
  verifyPassword: mockVerifyLegacyScrypt,
}));

jest.mock('@/lib/prisma', () => ({
  prisma: { account: { updateMany } },
}));

import { hashPassword, verifyPassword } from '@/lib/password';

describe('password hashing', () => {
  beforeEach(() => {
    updateMany.mockClear();
    mockVerifyLegacyScrypt.mockReset();
  });

  it('creates and verifies an Argon2id hash', async () => {
    const hash = await hashPassword('a long passphrase');
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword({ hash, password: 'a long passphrase' })).resolves.toBe(true);
    await expect(verifyPassword({ hash, password: 'wrong passphrase' })).resolves.toBe(false);
  });

  it('accepts a valid legacy scrypt hash and upgrades it atomically', async () => {
    const legacyHash = 'legacy-salt:legacy-hash';
    mockVerifyLegacyScrypt.mockResolvedValue(true);
    await expect(verifyPassword({ hash: legacyHash, password: 'legacy password' })).resolves.toBe(
      true,
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { providerId: 'credential', password: legacyHash } }),
    );
  });

  it('does not upgrade an invalid legacy password', async () => {
    mockVerifyLegacyScrypt.mockResolvedValue(false);
    await expect(
      verifyPassword({ hash: 'legacy-salt:legacy-hash', password: 'wrong password' }),
    ).resolves.toBe(false);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
