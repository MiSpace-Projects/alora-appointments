import {
  createTestimonialToken,
  hashTestimonialToken,
  isWellFormedTestimonialToken,
  testimonialDisplayName,
  testimonialInviteExpiry,
  testimonialSubmissionSchema,
} from '@/lib/testimonial-core';

describe('testimonial tokens', () => {
  it('creates a url-safe token whose hash is stored instead of the token', () => {
    const { token, tokenHash } = createTestimonialToken();
    expect(isWellFormedTestimonialToken(token)).toBe(true);
    expect(tokenHash).toBe(hashTestimonialToken(token));
    expect(tokenHash).not.toContain(token);
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('never repeats a token', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => createTestimonialToken().token));
    expect(tokens.size).toBe(50);
  });

  it('rejects malformed tokens before any lookup', () => {
    expect(isWellFormedTestimonialToken('')).toBe(false);
    expect(isWellFormedTestimonialToken('short')).toBe(false);
    expect(isWellFormedTestimonialToken(`${'a'.repeat(42)}/`)).toBe(false);
  });

  it('expires invites after 30 days', () => {
    const now = new Date('2026-11-22T10:00:00.000Z');
    expect(testimonialInviteExpiry(now).toISOString()).toBe('2026-12-22T10:00:00.000Z');
  });
});

describe('testimonialSubmissionSchema', () => {
  const valid = {
    rating: '5',
    body: 'Loved my nails, so neat.',
    nameStyle: 'first',
    consent: 'on',
  };

  it('accepts a complete submission and trims the text', () => {
    const result = testimonialSubmissionSchema.parse({
      ...valid,
      body: '  Loved my nails, so neat.  ',
    });
    expect(result).toEqual({
      rating: 5,
      body: 'Loved my nails, so neat.',
      nameStyle: 'first',
      consent: 'on',
    });
  });

  it.each([
    ['rating out of range', { rating: '6' }],
    ['fractional rating', { rating: '4.5' }],
    ['missing rating', { rating: '' }],
    ['text too short', { body: 'ok' }],
    ['text too long', { body: 'a'.repeat(1001) }],
    ['unknown name style', { nameStyle: 'nickname' }],
    ['no consent', { consent: undefined }],
  ])('rejects %s', (_label, change) => {
    expect(testimonialSubmissionSchema.safeParse({ ...valid, ...change }).success).toBe(false);
  });
});

describe('testimonialDisplayName', () => {
  it('uses the first name or the full name', () => {
    expect(testimonialDisplayName('  Thandi  Nkosi ', 'first')).toBe('Thandi');
    expect(testimonialDisplayName('Thandi  Nkosi', 'full')).toBe('Thandi Nkosi');
  });

  it('falls back when the name is blank', () => {
    expect(testimonialDisplayName('   ', 'full')).toBe('Alora client');
  });
});
