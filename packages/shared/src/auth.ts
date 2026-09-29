import { z } from 'zod';

export const OTP_LENGTH = 6;

export const emailSchema = z
  .string({ error: 'Email is required.' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .max(254, 'Email is too long.')
  .pipe(z.email({ error: 'Enter a valid email address.' }));

/** bcrypt only uses the first 72 bytes, so longer passwords are rejected rather than silently truncated. */
export const passwordSchema = z
  .string({ error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')
  .regex(/[A-Za-z]/, 'Password must include at least one letter.')
  .regex(/\d/, 'Password must include at least one number.');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  // Only presence is checked at login; the strength rules apply when the password is chosen.
  password: z.string({ error: 'Password is required.' }).min(1, 'Password is required.').max(72),
});

export const otpCodeSchema = z
  .string({ error: 'Code is required.' })
  .trim()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code from your email.`);

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
});

export const resendCodeSchema = z.object({
  email: emailSchema,
});

export type RegisterInput = z.input<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
