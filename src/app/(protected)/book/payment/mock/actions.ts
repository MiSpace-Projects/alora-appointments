'use server';

import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { isPaymentOwnedByUser, settleMockPayment } from '@/lib/data/payments';
import { isMockPaymentsEnabled } from '@/lib/payments/provider';

/**
 * Fake checkout outcome. Mirrors what Paystack's page does at the end: apply
 * the result server-side, then send the customer to our return page with
 * the reference. Only exists when the mock provider is enabled.
 */
export async function completeMockPaymentAction(formData: FormData): Promise<void> {
  if (!isMockPaymentsEnabled()) redirect('/');

  const session = await requireSession();

  const reference = String(formData.get('reference') ?? '');
  const outcome = formData.get('outcome') === 'success' ? 'success' : 'failed';

  if (await isPaymentOwnedByUser(session.user.id, reference)) {
    await settleMockPayment(reference, outcome);
  }

  redirect(`/book/payment?reference=${encodeURIComponent(reference)}`);
}
