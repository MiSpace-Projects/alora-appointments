/** @jest-environment node */

import { verifyPersistedSignUp } from '@/lib/sign-up-persistence';

const expected = { email: 'person@example.com', name: 'Person Name' };

describe('verifyPersistedSignUp', () => {
  it('accepts a response only when the matching user and name were persisted', async () => {
    const result = await verifyPersistedSignUp(
      { user: { id: 'persisted-user' } },
      expected,
      async () => ({ id: 'persisted-user', ...expected }),
    );

    expect(result).toBe('CREATED');
  });

  it('identifies Better Auth synthetic duplicate responses', async () => {
    const result = await verifyPersistedSignUp(
      { user: { id: 'synthetic-user' } },
      expected,
      async () => null,
    );

    expect(result).toBe('DUPLICATE');
  });

  it('rejects a persisted user whose name does not match the submitted name', async () => {
    const result = await verifyPersistedSignUp(
      { user: { id: 'persisted-user' } },
      expected,
      async () => ({ id: 'persisted-user', email: expected.email, name: 'Wrong Name' }),
    );

    expect(result).toBe('INVALID');
  });

  it('rejects malformed successful responses', async () => {
    await expect(verifyPersistedSignUp({}, expected)).resolves.toBe('INVALID');
  });
});
