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
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret-key',
      TURNSTILE_ALLOWED_HOSTNAMES: 'alora.example.com',
      BREVO_API_KEY: 'brevo-key',
      BREVO_SENDER_EMAIL: 'security@alora.example.com',
      EMAIL_OUTBOX_ENCRYPTION_KEY: Buffer.alloc(32, 3).toString('base64'),
      EMAIL_OUTBOX_WORKER_TOKEN: Buffer.alloc(32, 4).toString('base64'),
      BREVO_WEBHOOK_TOKEN: Buffer.alloc(32, 5).toString('base64'),
    });
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    expect(getProductionAuthConfigurationErrors()).toEqual([]);
  });

  it('rejects an invalid outbox encryption key', async () => {
    process.env.EMAIL_OUTBOX_ENCRYPTION_KEY = Buffer.alloc(12).toString('base64');
    const { getEmailOutboxKey } = await import('@/lib/auth-config');
    expect(() => getEmailOutboxKey()).toThrow('exactly 32 bytes');
  });

  it('rejects malformed base64 instead of accepting Node decoder coercion', async () => {
    process.env.EMAIL_OUTBOX_ENCRYPTION_KEY = `${Buffer.alloc(32, 7).toString('base64')}!`;
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    expect(getProductionAuthConfigurationErrors()).toContain(
      'EMAIL_OUTBOX_ENCRYPTION_KEY must be exactly 32 bytes in canonical base64',
    );
  });

  it('rejects human-readable and reused production secrets', async () => {
    const reused = Buffer.alloc(32, 9).toString('base64');
    Object.assign(process.env, {
      BETTER_AUTH_SECRET: 'human-readable-secret-that-is-long-enough',
      AUTH_FINGERPRINT_SECRET: reused,
      EMAIL_OUTBOX_WORKER_TOKEN: reused,
    });
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    const errors = getProductionAuthConfigurationErrors();

    expect(errors).toContain(
      'BETTER_AUTH_SECRET must be exactly 32 random bytes in canonical base64',
    );
    expect(errors).toContain(
      'Authentication, fingerprint, outbox, worker, and webhook secrets must be unique',
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

  it('returns configured origins and reports configured CAPTCHA', async () => {
    Object.assign(process.env, {
      BETTER_AUTH_URL: 'https://auth.alora.example.com/path',
      NEXT_PUBLIC_APP_URL: 'https://alora.example.com/another-path',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret-key',
    });
    const { getTrustedOrigins, isCaptchaConfigured } = await import('@/lib/auth-config');

    expect(getTrustedOrigins()).toEqual([
      'https://alora.example.com',
      'https://auth.alora.example.com',
    ]);
    expect(isCaptchaConfigured()).toBe(true);
  });

  it('derives a stable development-only outbox key when none is configured', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'development',
      BETTER_AUTH_SECRET: 'development-secret',
    };
    delete process.env.EMAIL_OUTBOX_ENCRYPTION_KEY;
    const { getEmailOutboxKey, getProductionAuthConfigurationErrors } =
      await import('@/lib/auth-config');

    expect(getEmailOutboxKey()).toHaveLength(32);
    expect(getProductionAuthConfigurationErrors()).toEqual([]);
  });

  it('does not derive an outbox key in production', async () => {
    delete process.env.EMAIL_OUTBOX_ENCRYPTION_KEY;
    const { getEmailOutboxKey } = await import('@/lib/auth-config');
    expect(() => getEmailOutboxKey()).toThrow('required in production');
  });

  it('rejects forwarded chains as the custom client-address source', async () => {
    process.env.AUTH_IP_ADDRESS_HEADERS = 'x-forwarded-for';
    const { getProductionAuthConfigurationErrors } = await import('@/lib/auth-config');
    expect(getProductionAuthConfigurationErrors()).toContain(
      'AUTH_IP_ADDRESS_HEADERS must not use the client-controlled x-forwarded-for chain',
    );
  });
});
