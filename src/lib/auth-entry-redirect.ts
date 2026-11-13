import { sanitizeRedirect } from './safe-redirect';

const AUTH_ENTRY_ROUTES = new Set(['/login', '/register']);

export function getAuthenticatedEntryRedirect(returnTo: string | null): string | null {
  const currentPath = sanitizeRedirect(returnTo);
  const currentUrl = new URL(currentPath, 'http://localhost');

  if (!AUTH_ENTRY_ROUTES.has(currentUrl.pathname)) return null;

  return sanitizeRedirect(currentUrl.searchParams.get('callbackUrl'));
}

export const TWO_FACTOR_PAGE = '/two-factor';

export function postSignInDestination(data: unknown, destination: string): string {
  if (
    data !== null &&
    typeof data === 'object' &&
    (data as { twoFactorRedirect?: unknown }).twoFactorRedirect === true
  ) {
    return TWO_FACTOR_PAGE;
  }
  return destination;
}
