import { consumeNamedThrottle, IdentityRateLimitError } from '@/lib/identity-throttle';
import { getConfiguredClientAddress, recordSecurityEvent } from '@/lib/security-events';

const MAX_REPORT_BYTES = 16 * 1_024;

function textField(value: unknown, maxLength = 500): string | null {
  return typeof value === 'string' ? value.slice(0, maxLength) : null;
}

export async function POST(request: Request): Promise<Response> {
  const address = getConfiguredClientAddress(request.headers) ?? 'unknown';
  try {
    await consumeNamedThrottle({
      scope: 'csp-report',
      identity: address,
      max: 60,
      windowSeconds: 60,
    });
  } catch (error) {
    if (error instanceof IdentityRateLimitError) return new Response(null, { status: 429 });
    throw error;
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_REPORT_BYTES) return new Response(null, { status: 413 });
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_REPORT_BYTES) return new Response(null, { status: 413 });

  try {
    const parsed = JSON.parse(raw) as unknown;
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    const envelope = typeof first === 'object' && first !== null ? first : {};
    const legacy = 'csp-report' in envelope ? envelope['csp-report'] : envelope;
    const report = typeof legacy === 'object' && legacy !== null ? legacy : {};
    await recordSecurityEvent({
      event: 'CSP_VIOLATION',
      outcome: 'BLOCKED',
      ipAddress: address,
      userAgent: request.headers.get('user-agent'),
      metadata: {
        documentUri: textField(report['document-uri'] ?? report['url']),
        violatedDirective: textField(
          report['violated-directive'] ?? report['effectiveDirective'],
          120,
        ),
        blockedUri: textField(report['blocked-uri'] ?? report['blockedURL']),
        disposition: textField(report['disposition'], 30),
      },
    });
  } catch {
    return new Response(null, { status: 400 });
  }
  return new Response(null, { status: 204 });
}
