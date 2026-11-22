import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

export const TESTIMONIAL_INVITE_DAYS = 30;
export const TESTIMONIAL_BODY_MIN = 10;
export const TESTIMONIAL_BODY_MAX = 1000;
export const TESTIMONIAL_MAX_PHOTOS = 4;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createTestimonialToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashTestimonialToken(token) };
}

export function hashTestimonialToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isWellFormedTestimonialToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function testimonialInviteExpiry(now: Date): Date {
  return new Date(now.getTime() + TESTIMONIAL_INVITE_DAYS * 24 * 60 * 60 * 1000);
}

export const testimonialSubmissionSchema = z.object({
  rating: z.coerce
    .number({ error: 'Choose a rating from 1 to 5 stars.' })
    .int('Choose a rating from 1 to 5 stars.')
    .min(1, 'Choose a rating from 1 to 5 stars.')
    .max(5, 'Choose a rating from 1 to 5 stars.'),
  body: z
    .string()
    .trim()
    .min(
      TESTIMONIAL_BODY_MIN,
      `Tell us a little more (at least ${TESTIMONIAL_BODY_MIN} characters).`,
    )
    .max(TESTIMONIAL_BODY_MAX, `Keep it under ${TESTIMONIAL_BODY_MAX} characters.`),
  nameStyle: z.enum(['first', 'full'], { error: 'Choose how your name appears.' }),
  consent: z.literal('on', { error: 'Please agree so we can share your testimonial.' }),
});

export type TestimonialSubmission = z.infer<typeof testimonialSubmissionSchema>;

export function testimonialDisplayName(fullName: string, style: 'first' | 'full'): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Alora client';
  if (style === 'full') return parts.join(' ');
  return parts[0];
}
