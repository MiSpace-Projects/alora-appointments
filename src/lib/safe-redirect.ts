const DEFAULT_REDIRECT = '/';

export function sanitizeRedirect(
  raw: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
): string {
  if (typeof raw !== 'string' || raw.length === 0) return fallback;

  const normalized = raw.replace(/\\/g, '/');

  if (!normalized.startsWith('/')) return fallback;
  if (normalized.startsWith('//')) return fallback;

  try {
    decodeURI(normalized);

    const url = new URL(normalized, 'http://localhost');
    if (url.origin !== 'http://localhost') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function loginWithCallback(pathname: string | null | undefined): string {
  const dest = sanitizeRedirect(pathname);
  return `/login?callbackUrl=${encodeURIComponent(dest)}`;
}
