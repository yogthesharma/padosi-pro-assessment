import { registerSchema } from '@padosipro/shared';
import { z } from 'zod';

/** The API's register rules plus a client-only "confirm password" check. */
export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const passwordRules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'A letter', test: (value: string) => /[A-Za-z]/.test(value) },
  { label: 'A number', test: (value: string) => /\d/.test(value) },
] as const;
