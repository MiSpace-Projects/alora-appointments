import { createHmac } from 'node:crypto';

const ORIGINAL_ENV = process.env;

describe('paystack webhook signature', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, PAYSTACK_SECRET_KEY: 'sk_test_unit' };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('accepts a body signed with the secret key and rejects anything else', async () => {
    const { isValidWebhookSignature } = await import('@/lib/payments/paystack');
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'alora_x' } });
    const good = createHmac('sha512', 'sk_test_unit').update(body).digest('hex');
    const bad = createHmac('sha512', 'sk_test_other').update(body).digest('hex');

    expect(isValidWebhookSignature(body, good)).toBe(true);
    expect(isValidWebhookSignature(body, bad)).toBe(false);
    expect(isValidWebhookSignature(body, null)).toBe(false);
    expect(isValidWebhookSignature(`${body} `, good)).toBe(false);
  });

  it('reports not configured when the key is missing', async () => {
    process.env = { ...ORIGINAL_ENV, PAYSTACK_SECRET_KEY: '' };
    const { isPaystackConfigured, isValidWebhookSignature } =
      await import('@/lib/payments/paystack');
    expect(isPaystackConfigured()).toBe(false);
    expect(isValidWebhookSignature('{}', 'abc')).toBe(false);
  });

  it('builds traceable references', async () => {
    const { buildPaymentReference } = await import('@/lib/payments/paystack');
    expect(buildPaymentReference('bk_123')).toMatch(/^alora_bk_123_[a-z0-9]+$/);
  });
});
