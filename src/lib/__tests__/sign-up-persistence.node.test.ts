import { signUpOutcome, verifyPersistedSignUp } from '@/lib/sign-up-persistence';

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

describe('signUpOutcome', () => {
  it('forwards the generic success response for an existing email and flags it', () => {
    expect(signUpOutcome('DUPLICATE')).toEqual({ forwardResponse: true, existingAccount: true });
  });

  it('forwards a real new account', () => {
    expect(signUpOutcome('CREATED')).toEqual({ forwardResponse: true, existingAccount: false });
  });

  it('replaces responses that do not match what was persisted', () => {
    expect(signUpOutcome('INVALID')).toEqual({ forwardResponse: false, existingAccount: false });
  });
});

describe('existing-email sign-up response', () => {
  const userBody = (id: string) => ({
    token: null,
    user: {
      id,
      name: expected.name,
      email: expected.email,
      emailVerified: false,
      image: null,
      createdAt: '2026-11-13T09:00:00.000Z',
      updatedAt: '2026-11-13T09:00:00.000Z',
      termsAccepted: true,
      marketingOptIn: false,
    },
  });

  async function respond(id: string, persisted: boolean): Promise<Response> {
    const original = Response.json(userBody(id), { status: 200 });
    const persistence = await verifyPersistedSignUp(
      await original.clone().json(),
      expected,
      async () => (persisted ? { id, ...expected } : null),
    );
    return signUpOutcome(persistence).forwardResponse
      ? original
      : Response.json({ code: 'ACCOUNT_PERSISTENCE_FAILED' }, { status: 500 });
  }

  it('looks the same to the client as a new sign-up', async () => {
    const created = await respond('real-user', true);
    const existing = await respond('synthetic-user', false);

    expect(existing.status).toBe(created.status);
    expect(existing.status).toBe(200);
    const createdBody = (await created.json()) as { user: Record<string, unknown> };
    const existingBody = (await existing.json()) as { user: Record<string, unknown> };
    expect(Object.keys(existingBody).sort()).toEqual(Object.keys(createdBody).sort());
    expect(Object.keys(existingBody.user).sort()).toEqual(Object.keys(createdBody.user).sort());
    expect(JSON.stringify(existingBody)).not.toMatch(/exists|already/i);
  });
});
