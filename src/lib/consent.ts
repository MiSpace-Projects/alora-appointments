import { z } from 'zod';
import { legalVersions } from '@/app/config/business';

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
