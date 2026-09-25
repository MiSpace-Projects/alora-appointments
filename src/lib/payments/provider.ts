import 'server-only';
import { isPaystackConfigured } from './paystack';

export type PaymentProvider = 'paystack' | 'mock';

/**
 * Which online-payment provider is active.
 *   - 'paystack' when PAYSTACK_SECRET_KEY is set (real gateway; always wins)
 *   - 'mock'     a fake hosted checkout for demos and pre-launch development
 *   - null       neither configured: pay-at-salon only
 * A real Paystack key always takes precedence, so adding it later flips the
 * whole journey to real payments with no other change.
 */
export function getPaymentProvider(): PaymentProvider | null {
  if (isPaystackConfigured()) return 'paystack';
  if (isMockPaymentsEnabled()) return 'mock';
  return null;
}

/**
 * Mock availability:
 *   - PAYMENTS_MOCK=false  → always off (force pay-at-salon only)
 *   - PAYMENTS_MOCK=true   → always on, INCLUDING production — for a pre-launch
 *                            WIP that needs the full journey clickable on the
 *                            deployed site while waiting for a Paystack account
 *   - unset                → on outside production (so `npm run dev` just works),
 *                            off in production
 * The mock checkout page is always labelled "Test mode" and charges nothing.
 * When a real Paystack key is present it wins regardless of this flag.
 */
export function isMockPaymentsEnabled(): boolean {
  if (process.env.PAYMENTS_MOCK === 'false') return false;
  if (process.env.PAYMENTS_MOCK === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

export function isOnlinePaymentAvailable(): boolean {
  return getPaymentProvider() !== null;
}

export const MOCK_REFERENCE_PREFIX = 'mock_';

export function isMockReference(reference: string): boolean {
  return reference.startsWith(MOCK_REFERENCE_PREFIX);
}
