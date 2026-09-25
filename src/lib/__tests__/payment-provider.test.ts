/**
 * Provider selection: Paystack wins when configured; the mock is dev-only and
 * can never activate in production; otherwise online payment is off.
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
      PAYMENTS_MOCK: 'true',
    };
    const { getPaymentProvider } = await import('@/lib/payments/provider');
    expect(getPaymentProvider()).toBe('paystack');
  });

  it('uses the mock only outside production', async () => {
    process.env = { ...process.env, NODE_ENV: 'development', PAYMENTS_MOCK: 'true' };
    const dev = await import('@/lib/payments/provider');
    expect(dev.getPaymentProvider()).toBe('mock');
    expect(dev.isOnlinePaymentAvailable()).toBe(true);

    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production', PAYMENTS_MOCK: 'true' };
    delete process.env.PAYSTACK_SECRET_KEY;
    const prod = await import('@/lib/payments/provider');
    expect(prod.getPaymentProvider()).toBeNull();
    expect(prod.isMockPaymentsEnabled()).toBe(false);
  });

  it('reports no provider when nothing is configured', async () => {
    process.env = { ...process.env, NODE_ENV: 'development' };
    const { getPaymentProvider, isOnlinePaymentAvailable } =
      await import('@/lib/payments/provider');
    expect(getPaymentProvider()).toBeNull();
    expect(isOnlinePaymentAvailable()).toBe(false);
  });

  it('recognises mock references', async () => {
    const { isMockReference } = await import('@/lib/payments/provider');
    expect(isMockReference('mock_abc_123')).toBe(true);
    expect(isMockReference('alora_abc_123')).toBe(false);
  });
});

export {};
