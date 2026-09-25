const ORIGINAL_ENV = process.env;

describe('production auth configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production' };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('fails closed when required controls are absent', async () => {
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    expect(getProductionAuthConfigurationErrors().length).toBeGreaterThan(5);
  });

  it('accepts a complete production contract', async () => {
    Object.assign(process.env, {
      BETTER_AUTH_SECRET: Buffer.alloc(32, 1).toString('base64'),
      BETTER_AUTH_URL: 'https://alora.example.com',
      NEXT_PUBLIC_APP_URL: 'https://alora.example.com',
      NEXT_PUBLIC_BETTER_AUTH_URL: 'https://alora.example.com',
      AUTH_IP_ADDRESS_HEADERS: 'cf-connecting-ip',
      AUTH_FINGERPRINT_SECRET: Buffer.alloc(32, 2).toString('base64'),
      RESEND_API_KEY: 're_test_key',
      EMAIL_FROM: 'Alora <no-reply@alora.example.com>',
    });
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    expect(getProductionAuthConfigurationErrors()).toEqual([]);
  });

  it('requires Resend email configuration', async () => {
    Object.assign(process.env, {
      BETTER_AUTH_SECRET: Buffer.alloc(32, 1).toString('base64'),
      BETTER_AUTH_URL: 'https://alora.example.com',
      NEXT_PUBLIC_APP_URL: 'https://alora.example.com',
      AUTH_IP_ADDRESS_HEADERS: 'cf-connecting-ip',
      AUTH_FINGERPRINT_SECRET: Buffer.alloc(32, 2).toString('base64'),
    });
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    const errors = getProductionAuthConfigurationErrors();
    expect(errors).toContain('RESEND_API_KEY is required');
    expect(errors).toContain('EMAIL_FROM must be set to a Resend-verified sender address');
  });

  it('rejects malformed base64 instead of accepting Node decoder coercion', async () => {
    process.env.AUTH_FINGERPRINT_SECRET = `${Buffer.alloc(32, 7).toString('base64')}!`;
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    expect(getProductionAuthConfigurationErrors()).toContain(
      'AUTH_FINGERPRINT_SECRET must be exactly 32 random bytes in canonical base64',
    );
  });

  it('rejects a human-readable production secret', async () => {
    process.env.BETTER_AUTH_SECRET = 'human-readable-secret-that-is-long-enough';
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    expect(getProductionAuthConfigurationErrors()).toContain(
      'BETTER_AUTH_SECRET must be exactly 32 random bytes in canonical base64',
    );
  });

  it('rejects reused production secrets', async () => {
    const reused = Buffer.alloc(32, 9).toString('base64');
    Object.assign(process.env, {
      BETTER_AUTH_SECRET: reused,
      AUTH_FINGERPRINT_SECRET: reused,
    });
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    expect(getProductionAuthConfigurationErrors()).toContain(
      'Authentication and fingerprint secrets must be unique',
    );
  });

  it('rejects a public auth URL on a different origin', async () => {
    Object.assign(process.env, {
      BETTER_AUTH_URL: 'https://alora.example.com',
      NEXT_PUBLIC_BETTER_AUTH_URL: 'https://auth.example.net',
    });
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');

    expect(getProductionAuthConfigurationErrors()).toContain(
      'NEXT_PUBLIC_BETTER_AUTH_URL must use the BETTER_AUTH_URL origin',
    );
  });

  it('returns configured trusted origins', async () => {
    Object.assign(process.env, {
      BETTER_AUTH_URL: 'https://auth.alora.example.com/path',
      NEXT_PUBLIC_APP_URL: 'https://alora.example.com/another-path',
    });
    const { getTrustedOrigins } = await import('@/lib/auth-config');

    expect(getTrustedOrigins()).toEqual([
      'https://alora.example.com',
      'https://auth.alora.example.com',
    ]);
  });

  it('rejects forwarded chains as the custom client-address source', async () => {
    process.env.AUTH_IP_ADDRESS_HEADERS = 'x-forwarded-for';
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    expect(getProductionAuthConfigurationErrors()).toContain(
      'AUTH_IP_ADDRESS_HEADERS must not use the client-controlled x-forwarded-for chain',
    );
  });
});
