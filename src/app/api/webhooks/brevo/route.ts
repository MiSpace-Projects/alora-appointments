import { timingSafeEqual } from 'node:crypto';
import { authRuntimeConfig } from '@/lib/auth-config';
import { applyBrevoWebhook } from '@/lib/email';

function authorized(request: Request): boolean {
  const expected = authRuntimeConfig.email.webhookToken;
  const actual = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!expected || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > 64 * 1_024) {
    return Response.json({ message: 'Payload too large' }, { status: 413 });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > 64 * 1_024) {
    return Response.json({ message: 'Payload too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return Response.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const events = Array.isArray(body) ? body : [body];
  for (const event of events.slice(0, 500)) {
    if (typeof event === 'object' && event !== null) {
      await applyBrevoWebhook(event);
    }
  }
  return new Response(null, { status: 204 });
}
