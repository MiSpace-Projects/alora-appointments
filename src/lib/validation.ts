import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
  rememberMe: z.boolean().optional().default(false),
});

export const accountNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be 80 characters or fewer')
  .refine((name) => !/[\u0000-\u001f\u007f]/.test(name), 'Name contains invalid characters');

export const newPasswordSchema = z
  .string()
  .min(15, 'Password must be at least 15 characters')
  .max(128, 'Password is too long');

export const authSignUpSchema = z.object({
  name: accountNameSchema,
  email: z.string().trim().toLowerCase().email('Please enter a valid email'),
  password: newPasswordSchema,
  // POPIA s18 notice / ECTA terms: acceptance is mandatory and enforced server-side.
  termsAccepted: z
    .boolean()
    .refine((accepted) => accepted === true, 'Please accept the terms and privacy policy'),
  // POPIA s69: marketing is strictly opt-in and unticked by default.
  marketingOptIn: z.boolean(),
});

export const registerSchema = authSignUpSchema
  .extend({
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const createBookingSchema = z.object({
  serviceId: z.string().min(1, 'Please choose a service'),
  // Coerce so form strings and JSON payloads both validate to a real Date.
  startsAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: 'Choose a time in the future',
  }),
  notes: z.string().max(500, 'Notes are too long').optional(),
  // ECTA s43: the customer chooses how to settle before confirming.
  paymentMethod: z.enum(['PAY_NOW', 'PAY_IN_SALON']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
