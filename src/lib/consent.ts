import { z } from 'zod';
import { legalVersions } from '@/app/config/business';

/**
 * Cookie-notice consent model. Shared by the banner (client), the server action
 * that records consent for signed-in users, and the cookie policy page.
 *
 * Only strictly necessary cookies exist today, so `categories` has a single
 * always-on entry. The shape is deliberately extensible: adding an optional
 * category later means adding it here (default `false`), rendering a toggle in
 * the banner, and gating the script on `useConsent()` — no other changes.
 */
export const CONSENT_COOKIE_NAME = 'alora_consent';
export const CONSENT_MAX_AGE_DAYS = 180;
export const CONSENT_VERSION = legalVersions.cookies;

export const consentCategorySchema = z.object({
  necessary: z.literal(true),
});

export const consentStateSchema = z.object({
  version: z.string().min(1),
  acknowledgedAt: z.string().datetime(),
  categories: consentCategorySchema,
});

export type ConsentCategories = z.infer<typeof consentCategorySchema>;
export type ConsentState = z.infer<typeof consentStateSchema>;

export function createConsentState(): ConsentState {
  return {
    version: CONSENT_VERSION,
    acknowledgedAt: new Date().toISOString(),
    categories: { necessary: true },
  };
}

/** Parse a raw cookie value; returns null for missing, malformed, or outdated-version consent. */
export function parseConsentCookie(raw: string | undefined | null): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = consentStateSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    if (!parsed.success) return null;
    return parsed.data.version === CONSENT_VERSION ? parsed.data : null;
  } catch {
    return null;
  }
}

export function serializeConsentCookie(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}
