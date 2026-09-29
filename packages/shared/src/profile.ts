import { z } from 'zod';

/**
 * Accepts the ways people actually type Indian mobile numbers ("98765 43210", "+91-9876543210",
 * "09876543210") and normalises them to E.164 (+919876543210). Indian mobiles start with 6-9.
 */
export const indianMobileSchema = z
  .string({ error: 'Mobile number is required.' })
  .trim()
  .min(1, 'Mobile number is required.')
  .transform((raw) => raw.replace(/[\s\-()]/g, ''))
  .transform((digits) => {
    if (/^\+91\d{10}$/.test(digits)) return digits.slice(3);
    if (/^91\d{10}$/.test(digits)) return digits.slice(2);
    if (/^0\d{10}$/.test(digits)) return digits.slice(1);
    return digits;
  })
  .refine((national) => /^[6-9]\d{9}$/.test(national), 'Enter a valid 10-digit Indian mobile number.')
  .transform((national) => `+91${national}`);

export const profileSchema = z.object({
  name: z
    .string({ error: 'Name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.')
    .regex(/^\p{L}[\p{L}\p{M} .'-]*$/u, "Name can only contain letters, spaces, and . ' -"),
  mobile: indianMobileSchema,
  address: z
    .string({ error: 'Address is required.' })
    .trim()
    .min(10, 'Please enter your full address (at least 10 characters).')
    .max(300, 'Address must be at most 300 characters.'),
  // Optional: most PadosiPro customers are households, but the Workforce Management and
  // Business Support tracks serve small businesses, where the name helps the Lifestyle Manager.
  businessName: z
    .string()
    .trim()
    .max(100, 'Business name must be at most 100 characters.')
    .nullish()
    .transform((value) => (value ? value : null)),
});

export type ProfileFormInput = z.input<typeof profileSchema>;
export type ProfileInput = z.output<typeof profileSchema>;
