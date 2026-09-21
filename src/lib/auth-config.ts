const DEVELOPMENT_ORIGIN = 'http://localhost:3000';
const SECRET_BYTES = 32;

function csv(value: string | undefined): string[] {
  return value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

function validUrl(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function decodeCanonicalBase64(
  value: string | undefined,
  byteLength = SECRET_BYTES,
): Buffer | null {
  if (!value) return null;

  const encoded = value.trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 !== 0) return null;

  const key = Buffer.from(encoded, 'base64');
  return key.length === byteLength && key.toString('base64') === encoded ? key : null;
}

export const authRuntimeConfig = {
  baseUrl: process.env.BETTER_AUTH_URL ?? DEVELOPMENT_ORIGIN,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? DEVELOPMENT_ORIGIN,
  secret: process.env.BETTER_AUTH_SECRET ?? '',
  fingerprintSecret: process.env.AUTH_FINGERPRINT_SECRET ?? process.env.BETTER_AUTH_SECRET ?? '',
  ipAddressHeaders:
    csv(process.env.AUTH_IP_ADDRESS_HEADERS).length > 0
      ? csv(process.env.AUTH_IP_ADDRESS_HEADERS)
      : ['x-real-ip'],
  trustedProxies: csv(process.env.AUTH_TRUSTED_PROXIES),
  captcha: {
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
    secretKey: process.env.TURNSTILE_SECRET_KEY ?? '',
    allowedHostnames: csv(process.env.TURNSTILE_ALLOWED_HOSTNAMES),
  },
  // Transactional email via Resend. `from` must be an address on a
  // Resend-verified domain (e.g. "Alora <no-reply@alorastudios.co.za>").
  email: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.EMAIL_FROM ?? '',
  },
} as const;

export function isCaptchaConfigured(): boolean {
  return Boolean(authRuntimeConfig.captcha.siteKey && authRuntimeConfig.captcha.secretKey);
}

export function getTrustedOrigins(): string[] {
  const origins = new Set<string>();
  for (const value of [authRuntimeConfig.appUrl, authRuntimeConfig.baseUrl]) {
    const parsed = validUrl(value);
    if (parsed) origins.add(parsed.origin);
  }
  if (process.env.NODE_ENV !== 'production') origins.add(DEVELOPMENT_ORIGIN);
  return [...origins];
}

export function getProductionAuthConfigurationErrors(): string[] {
  if (process.env.NODE_ENV !== 'production') return [];

  const errors: string[] = [];
  const baseUrl = validUrl(process.env.BETTER_AUTH_URL);
  const appUrl = validUrl(process.env.NEXT_PUBLIC_APP_URL);
  const publicAuthUrlValue = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  const publicAuthUrl = validUrl(publicAuthUrlValue);
  const ipAddressHeaders = csv(process.env.AUTH_IP_ADDRESS_HEADERS).map((header) =>
    header.toLowerCase(),
  );

  if (!decodeCanonicalBase64(process.env.BETTER_AUTH_SECRET)) {
    errors.push('BETTER_AUTH_SECRET must be exactly 32 random bytes in canonical base64');
  }
  if (!baseUrl || baseUrl.protocol !== 'https:') {
    errors.push('BETTER_AUTH_URL must be an absolute HTTPS URL');
  }
  if (!appUrl || appUrl.protocol !== 'https:') {
    errors.push('NEXT_PUBLIC_APP_URL must be an absolute HTTPS URL');
  }
  if (publicAuthUrlValue) {
    if (!publicAuthUrl || publicAuthUrl.protocol !== 'https:') {
      errors.push('NEXT_PUBLIC_BETTER_AUTH_URL must be an absolute HTTPS URL when configured');
    } else if (baseUrl && publicAuthUrl.origin !== baseUrl.origin) {
      errors.push('NEXT_PUBLIC_BETTER_AUTH_URL must use the BETTER_AUTH_URL origin');
    }
  }
  if (ipAddressHeaders.length !== 1) {
    errors.push('AUTH_IP_ADDRESS_HEADERS must contain exactly one edge-overwritten header');
  } else if (ipAddressHeaders[0] === 'x-forwarded-for') {
    errors.push('AUTH_IP_ADDRESS_HEADERS must not use the client-controlled x-forwarded-for chain');
  }
  if (!decodeCanonicalBase64(process.env.AUTH_FINGERPRINT_SECRET)) {
    errors.push('AUTH_FINGERPRINT_SECRET must be exactly 32 random bytes in canonical base64');
  }
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || !process.env.TURNSTILE_SECRET_KEY) {
    errors.push('Cloudflare Turnstile site and secret keys are required');
  }
  if (csv(process.env.TURNSTILE_ALLOWED_HOSTNAMES).length === 0) {
    errors.push('TURNSTILE_ALLOWED_HOSTNAMES must list the production hostnames');
  }
  if (!process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is required');
  }
  if (!process.env.EMAIL_FROM) {
    errors.push('EMAIL_FROM must be set to a Resend-verified sender address');
  }

  const configuredSecrets = [
    process.env.BETTER_AUTH_SECRET,
    process.env.AUTH_FINGERPRINT_SECRET,
  ].filter((value): value is string => Boolean(value));
  if (new Set(configuredSecrets).size !== configuredSecrets.length) {
    errors.push('Authentication and fingerprint secrets must be unique');
  }

  return errors;
}
