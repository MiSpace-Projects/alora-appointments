/**
 * Provider selection: Paystack wins when configured; the mock is the default in
 * development (so the pay-now journey is always visible) but can be forced off
 * and can never activate in production.
 */
const ORIGINAL_ENV = process.env;

describe('getPaymentProvider', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.PAYSTACK_SECRET_KEY;
    delete process.env.PAYMENTS_MOCK;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('prefers Paystack when a key is set', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'development',
      PAYSTACK_SECRET_KEY: 'sk_test_x',
    };
    const { getPaymentProvider } = await import('@/lib/payments/provider');
    expect(getPaymentProvider()).toBe('paystack');
  });

  it('defaults to the mock in development so pay-now is always visible', async () => {
    process.env = { ...process.env, NODE_ENV: 'development' };
    const dev = await import('@/lib/payments/provider');
    expect(dev.getPaymentProvider()).toBe('mock');
    expect(dev.isOnlinePaymentAvailable()).toBe(true);
  });

  it('can be forced off in development with PAYMENTS_MOCK=false', async () => {
    process.env = { ...process.env, NODE_ENV: 'development', PAYMENTS_MOCK: 'false' };
    const dev = await import('@/lib/payments/provider');
    expect(dev.getPaymentProvider()).toBeNull();
    expect(dev.isOnlinePaymentAvailable()).toBe(false);
  });

  it('never enables the mock in production, even if the flag is set', async () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production', PAYMENTS_MOCK: 'true' };
    delete process.env.PAYSTACK_SECRET_KEY;
    const prod = await import('@/lib/payments/provider');
    expect(prod.getPaymentProvider()).toBeNull();
    expect(prod.isMockPaymentsEnabled()).toBe(false);
  });

  it('recognises mock references', async () => {
    const { isMockReference } = await import('@/lib/payments/provider');
    expect(isMockReference('mock_abc_123')).toBe(true);
    expect(isMockReference('alora_abc_123')).toBe(false);
  });
});

export {};
