import 'server-only';
import { isPaystackConfigured } from './paystack';

export type PaymentProvider = 'paystack' | 'mock';

export function getPaymentProvider(): PaymentProvider | null {
  if (isPaystackConfigured()) return 'paystack';
  if (isMockPaymentsEnabled()) return 'mock';
  return null;
}

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
