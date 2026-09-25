import 'server-only';
import { isPaystackConfigured } from './paystack';

export type PaymentProvider = 'paystack' | 'mock';

/**
 * Which online-payment provider is active.
 *   - 'paystack' when PAYSTACK_SECRET_KEY is set (real gateway; any environment)
 *   - 'mock'     a fake hosted checkout for demos and local development —
 *                on by default outside production so the pay-now journey is
 *                always visible in `npm run dev`, never live money
 *   - null       only in production with no real key: pay-at-salon only
 * The mock can never activate in production; the production validator also
 * refuses to boot with PAYMENTS_MOCK explicitly set there.
 */
export function getPaymentProvider(): PaymentProvider | null {
  if (isPaystackConfigured()) return 'paystack';
  if (isMockPaymentsEnabled()) return 'mock';
  return null;
}

/**
 * The mock is enabled in any non-production environment unless explicitly
 * turned off with PAYMENTS_MOCK=false. This means a plain `npm run dev` shows
 * the full pay-now journey with no setup. Production is always off.
 */
export function isMockPaymentsEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.PAYMENTS_MOCK !== 'false';
}

export function isOnlinePaymentAvailable(): boolean {
  return getPaymentProvider() !== null;
}

export const MOCK_REFERENCE_PREFIX = 'mock_';

export function isMockReference(reference: string): boolean {
  return reference.startsWith(MOCK_REFERENCE_PREFIX);
}
