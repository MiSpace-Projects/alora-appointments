import { NextResponse } from 'next/server';
import {
  isPaystackConfigured,
  isValidWebhookSignature,
  webhookEventSchema,
} from '@/lib/payments/paystack';
import { recordProviderRefund, settlePaymentByReference } from '@/lib/data/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Paystack webhook. Authenticity: HMAC-SHA512 over the raw body with the
 * secret key. Trust: even a valid `charge.success` is not taken at face value;
 * the reference is re-verified with Paystack's API before anything changes.
 * Always answers 200 for authentic events so Paystack stops retrying; the
 * settlement itself is idempotent.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');
  if (!isValidWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = webhookEventSchema.safeParse(event);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid event' }, { status: 400 });
  }

  const { event: name, data } = parsed.data;

  try {
    if (name === 'charge.success' || name === 'charge.failed') {
      const reference = typeof data.reference === 'string' ? data.reference : null;
      if (reference) await settlePaymentByReference(reference);
    } else if (name.startsWith('refund.')) {
      const transactionReference =
        typeof data.transaction_reference === 'string' ? data.transaction_reference : null;
      const amount = typeof data.amount === 'number' ? data.amount : null;
      const status = typeof data.status === 'string' ? data.status : name.replace('refund.', '');
      if (transactionReference && amount !== null) {
        await recordProviderRefund({ transactionReference, amountCents: amount, status });
      }
    }
  } catch (error) {
    // Logged for follow-up; a 200 prevents a retry storm for a reference we
    // could not settle right now (the return page will also try).
    console.error('[paystack webhook] handler error', name, error);
  }

  return NextResponse.json({ received: true });
}
