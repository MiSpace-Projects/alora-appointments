import { timingSafeEqual } from 'node:crypto';
import { authRuntimeConfig } from '@/lib/auth-config';
import { processEmailOutbox } from '@/lib/email';

function authorized(request: Request): boolean {
  const expected = authRuntimeConfig.email.workerToken;
  const actual = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!expected || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const result = await processEmailOutbox();
  return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
