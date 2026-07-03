import type { NextConfig } from 'next';

/**
 * Content-Security-Policy — shipped in Report-Only mode first.
 *
 * The app currently renders one inline <script> (the no-flash theme setter in
 * layout.tsx) and framer-motion injects inline styles, so a strict enforced
 * `script-src`/`style-src` would break rendering today. Report-Only lets the
 * policy ride along and surface violations without breaking anything; the path
 * to enforcement is a nonce migration (generate a per-request nonce in
 * middleware, attach it to the inline script and swap 'unsafe-inline' for
 * 'nonce-…'). Tracked as follow-up — do not flip to enforced until that lands.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://images.pexels.com",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
]
  .join('; ')
  .concat(';');

// Enforced hardening headers — these are safe to turn on now (no rendering
// impact) and cover clickjacking, MIME sniffing, referrer leakage, HSTS and
// unused browser features.
const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
