import { loginSchema, registerSchema } from '@/lib/validation';

describe('loginSchema', () => {
  it('accepts a valid login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'password1' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'password1' }).success).toBe(false);
  });

  it('rejects a short password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'short' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  const base = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  };

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it('requires an uppercase letter and a number', () => {
    expect(
      registerSchema.safeParse({ ...base, password: 'lowercase', confirmPassword: 'lowercase' })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: 'nonumber', confirmPassword: 'nonumber' })
        .success,
    ).toBe(false);
  });

  it('rejects mismatched confirmation', () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: 'Different1' });
    expect(result.success).toBe(false);
  });
});
