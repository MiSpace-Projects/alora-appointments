'use server';

import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { isPaymentOwnedByUser, settleMockPayment } from '@/lib/data/payments';
import { isMockPaymentsEnabled } from '@/lib/payments/provider';

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
