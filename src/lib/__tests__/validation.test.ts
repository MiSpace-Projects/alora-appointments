import {
  authSignUpSchema,
  createBookingSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/validation';

describe('loginSchema', () => {
  it('accepts a valid login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'password1' }).success).toBe(true);
  });

  it('rejects an invalid email and an empty password', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'password1' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });

  it('continues to accept legacy passwords shorter than the new registration minimum', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'legacy12' }).success).toBe(true);
  });
});

describe('registration validation', () => {
  const base = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'a long passphrase',
    confirmPassword: 'a long passphrase',
  };

  it('accepts a 15-character passphrase without composition rules', () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a password shorter than 15 characters', () => {
    const password = 'too short';
    expect(registerSchema.safeParse({ ...base, password, confirmPassword: password }).success).toBe(
      false,
    );
  });

  it('rejects one-character and control-character names server-side', () => {
    expect(authSignUpSchema.safeParse({ ...base, name: 'A' }).success).toBe(false);
    expect(authSignUpSchema.safeParse({ ...base, name: 'Ada\u0000Lovelace' }).success).toBe(false);
  });

  it('normalizes names and email addresses', () => {
    const result = authSignUpSchema.parse({
      ...base,
      name: '  Ada Lovelace  ',
      email: 'ADA@EXAMPLE.COM',
    });
    expect(result.name).toBe('Ada Lovelace');
    expect(result.email).toBe('ada@example.com');
  });

  it('rejects mismatched confirmation', () => {
    expect(
      registerSchema.safeParse({ ...base, confirmPassword: 'another passphrase' }).success,
    ).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('enforces the same password policy as registration', () => {
    expect(
      resetPasswordSchema.safeParse({
        password: 'a long passphrase',
        confirmPassword: 'a long passphrase',
      }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({ password: 'short', confirmPassword: 'short' }).success,
    ).toBe(false);
  });
});

describe('createBookingSchema', () => {
  it('accepts a future form date and coerces it to Date', () => {
    const result = createBookingSchema.parse({
      serviceId: 'service-1',
      startsAt: new Date(Date.now() + 60_000).toISOString(),
    });

    expect(result.startsAt).toBeInstanceOf(Date);
  });

  it('rejects a booking in the past', () => {
    expect(
      createBookingSchema.safeParse({
        serviceId: 'service-1',
        startsAt: new Date(Date.now() - 60_000).toISOString(),
      }).success,
    ).toBe(false);
  });
});
