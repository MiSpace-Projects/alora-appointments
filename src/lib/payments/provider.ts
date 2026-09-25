import 'server-only';
import { isPaystackConfigured } from './paystack';

export type PaymentProvider = 'paystack' | 'mock';

/**
 * Which online-payment provider is active.
 *   - 'paystack' when PAYSTACK_SECRET_KEY is set
 *   - 'mock'     when PAYMENTS_MOCK=true outside production: a fake hosted
 *                checkout for demos and local development, never live money
 *   - null       online payment is not offered (pay-at-salon only)
 * The mock can never activate in production; the production validator also
 * refuses to boot with PAYMENTS_MOCK set there.
 */
export function getPaymentProvider(): PaymentProvider | null {
  if (isPaystackConfigured()) return 'paystack';
  if (isMockPaymentsEnabled()) return 'mock';
  return null;
}

export function isMockPaymentsEnabled(): boolean {
  return process.env.PAYMENTS_MOCK === 'true' && process.env.NODE_ENV !== 'production';
}

export function isOnlinePaymentAvailable(): boolean {
  return getPaymentProvider() !== null;
}

export const MOCK_REFERENCE_PREFIX = 'mock_';

export function isMockReference(reference: string): boolean {
  return reference.startsWith(MOCK_REFERENCE_PREFIX);
}
