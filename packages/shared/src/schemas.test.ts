import { describe, expect, it } from 'vitest';
import { indianMobileSchema, passwordSchema, profileSchema, registerSchema } from './index.js';

describe('indianMobileSchema', () => {
  it.each(['9876543210', '98765 43210', '+91 98765-43210', '+919876543210', '919876543210', '09876543210'])(
    'normalises %s to +919876543210',
    (input) => {
      expect(indianMobileSchema.parse(input)).toBe('+919876543210');
    },
  );

  it.each(['12345', '5876543210', '98765432101', '+1 9876543210', 'abcdefghij'])('rejects %s', (input) => {
    expect(indianMobileSchema.safeParse(input).success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('needs 8+ characters with a letter and a number', () => {
    expect(passwordSchema.safeParse('Sunrise2026').success).toBe(true);
    expect(passwordSchema.safeParse('short1').success).toBe(false);
    expect(passwordSchema.safeParse('onlyletters').success).toBe(false);
    expect(passwordSchema.safeParse('12345678').success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('trims and lower-cases the email', () => {
    expect(registerSchema.parse({ email: '  Asha@Example.COM ', password: 'Sunrise2026' }).email).toBe('asha@example.com');
  });
});

describe('profileSchema', () => {
  it('treats an empty business name as not provided', () => {
    const parsed = profileSchema.parse({
      name: 'Asha Rao',
      mobile: '9876543210',
      address: 'Road No. 36, Jubilee Hills, Hyderabad',
      businessName: '   ',
    });
    expect(parsed.businessName).toBeNull();
  });
});
