export const SONNER_STYLE_HASH = 'sha256-CIxDM5jnsGiKqXs2v7NKCY5MzdR9gu6TtiMJrDw29AY=';
export const EMPTY_STYLE_HASH = 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';

export function buildCsp(nonce: string, environment: string | undefined): string {
  const isDevelopment = environment === 'development';
  const developmentDirectives = isDevelopment ? " 'unsafe-eval' ws: http:" : '';
  const styleSrc = isDevelopment
    ? "style-src 'self' 'unsafe-inline'"
    : `style-src 'self' 'nonce-${nonce}' '${SONNER_STYLE_HASH}' '${EMPTY_STYLE_HASH}'`;
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentDirectives}`,
    styleSrc,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.pexels.com",
    "font-src 'self' data:",
    `connect-src 'self'${developmentDirectives}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    'report-uri /api/security/csp-report',
    'report-to csp-endpoint',
    ...(environment === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}
