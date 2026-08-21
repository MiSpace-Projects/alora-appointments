/**
 * safe-redirect.ts
 *
 * Single source of truth for validating post-auth redirect targets.
 *
 * Open-redirect defence: an attacker-supplied `callbackUrl` must never be able
 * to send a user off-origin after login/OAuth. A naive `startsWith('/')` check
 * is not enough — `//evil.com` and `/\evil.com` both start with a slash yet the
 * browser resolves them to a different origin.
 *
 * We accept only same-origin *path* redirects and fall back to a safe default
 * for anything else (absolute URLs, protocol-relative `//`, backslash tricks,
 * malformed input).
 */

const DEFAULT_REDIRECT = '/';

export function sanitizeRedirect(
  raw: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
): string {
  if (typeof raw !== 'string' || raw.length === 0) return fallback;

  // Browsers treat backslashes as forward slashes in URLs, so normalise first
  // to stop `/\evil.com` from slipping past the protocol-relative check.
  const normalized = raw.replace(/\\/g, '/');

  if (!normalized.startsWith('/')) return fallback; // no absolute or scheme-relative URLs
  if (normalized.startsWith('//')) return fallback; // protocol-relative → off-origin

  try {
    // Reject malformed percent escapes instead of allowing browsers to
    // interpret them differently at a later redirect boundary.
    decodeURI(normalized);

    // Resolve against a throwaway base. If the result leaves that origin, the
    // input encoded an absolute destination and must be rejected.
    const url = new URL(normalized, 'http://localhost');
    if (url.origin !== 'http://localhost') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Build a `/login?callbackUrl=...` URL with a sanitised destination.
 * Shared by every "you must sign in first" path so the query-param contract
 * (`callbackUrl`) stays consistent across middleware, guards and components.
 */
export function loginWithCallback(pathname: string | null | undefined): string {
  const dest = sanitizeRedirect(pathname);
  return `/login?callbackUrl=${encodeURIComponent(dest)}`;
}
