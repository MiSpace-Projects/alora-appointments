import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const PAYSTACK_API = 'https://api.paystack.co';

export function getPaystackSecretKey(): string | null {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function isPaystackConfigured(): boolean {
  return getPaystackSecretKey() !== null;
}

export function getPaystackConfigurationWarnings(): string[] {
  const key = getPaystackSecretKey();
  if (!key) return [];
  const warnings: string[] = [];
  if (process.env.NODE_ENV === 'production' && !key.startsWith('sk_live_')) {
    warnings.push('PAYSTACK_SECRET_KEY is not a live key; online payments are in test mode');
  }
  return warnings;
}

const initializeResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: z
    .object({
      authorization_url: z.string().url(),
      access_code: z.string(),
      reference: z.string(),
    })
    .optional(),
});

export const verifiedTransactionSchema = z.object({
  id: z.number().optional(),
  status: z.string(),
  reference: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  channel: z.string().nullable().optional(),
  paid_at: z.string().nullable().optional(),
  gateway_response: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
  customer: z.object({ email: z.string().optional() }).partial().optional(),
});

export type VerifiedTransaction = z.infer<typeof verifiedTransactionSchema>;

const verifyResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: verifiedTransactionSchema.optional(),
});

const refundResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: z
    .object({
      id: z.number().optional(),
      status: z.string().optional(),
      amount: z.number().int().optional(),
      transaction: z.unknown().optional(),
    })
    .optional(),
});

export class PaystackError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_CONFIGURED' | 'REQUEST_FAILED' | 'PROVIDER_REJECTED',
  ) {
    super(message);
    this.name = 'PaystackError';
  }
}

async function paystackFetch(path: string, init: RequestInit): Promise<unknown> {
  const key = getPaystackSecretKey();
  if (!key) throw new PaystackError('Paystack is not configured', 'NOT_CONFIGURED');

  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    });
  } catch (error) {
    throw new PaystackError(
      error instanceof Error ? error.message : 'Network error',
      'REQUEST_FAILED',
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Paystack responded ${response.status}`;
    throw new PaystackError(message, 'PROVIDER_REJECTED');
  }
  return body;
}

export interface InitializeInput {
  email: string;
  amountCents: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string | number>;
}

export interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializeTransaction(input: InitializeInput): Promise<InitializeResult> {
  const raw = await paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: input.amountCents,
      currency: 'ZAR',
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  const parsed = initializeResponseSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.status || !parsed.data.data) {
    throw new PaystackError(
      parsed.success ? (parsed.data.message ?? 'Initialisation failed') : 'Unexpected response',
      'PROVIDER_REJECTED',
    );
  }
  return {
    authorizationUrl: parsed.data.data.authorization_url,
    accessCode: parsed.data.data.access_code,
    reference: parsed.data.data.reference,
  };
}

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const raw = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
  });
  const parsed = verifyResponseSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.status || !parsed.data.data) {
    throw new PaystackError(
      parsed.success ? (parsed.data.message ?? 'Verification failed') : 'Unexpected response',
      'PROVIDER_REJECTED',
    );
  }
  return parsed.data.data;
}

export interface RefundResult {
  status: string;
  amountCents: number;
  refundId: string | null;
}

export async function refundTransaction(
  reference: string,
  amountCents: number,
): Promise<RefundResult> {
  const raw = await paystackFetch('/refund', {
    method: 'POST',
    body: JSON.stringify({ transaction: reference, amount: amountCents, currency: 'ZAR' }),
  });
  const parsed = refundResponseSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.status) {
    throw new PaystackError(
      parsed.success ? (parsed.data.message ?? 'Refund failed') : 'Unexpected response',
      'PROVIDER_REJECTED',
    );
  }
  return {
    status: parsed.data.data?.status ?? 'pending',
    amountCents: parsed.data.data?.amount ?? amountCents,
    refundId: parsed.data.data?.id != null ? String(parsed.data.data.id) : null,
  };
}

export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  const key = getPaystackSecretKey();
  if (!key || !signature) return false;
  const expected = createHmac('sha512', key).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export const webhookEventSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

export function buildPaymentReference(bookingId: string): string {
  const stamp = Date.now().toString(36);
  return `alora_${bookingId}_${stamp}`;
}
