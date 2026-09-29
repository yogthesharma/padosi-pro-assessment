import { describe, expect, it } from 'vitest';
import { generateOtp, hashOtp, nextSendAllowedAt, otpMatches } from '../src/modules/otp/otp.js';

const SECRET = 'unit-test-secret-that-is-at-least-32-chars';
const policy = { resendCooldownSeconds: 30, maxSendsPerHour: 5 };
const at = (seconds: number) => new Date(Date.UTC(2026, 8, 29, 10, 0, 0) + seconds * 1000);

describe('generateOtp', () => {
  it('always returns exactly 6 digits', () => {
    for (let i = 0; i < 1000; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it('zero-pads small numbers instead of producing shorter codes', () => {
    expect(generateOtp(() => 42)).toBe('000042');
    expect(generateOtp(() => 0)).toBe('000000');
    expect(generateOtp(() => 999_999)).toBe('999999');
  });

  it('asks the random source for the full 000000-999999 range', () => {
    let bounds: [number, number] | undefined;
    generateOtp((min, max) => {
      bounds = [min, max];
      return 0;
    });
    expect(bounds).toEqual([0, 1_000_000]);
  });

  it('is not predictable across calls', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateOtp()));
    expect(codes.size).toBeGreaterThan(190);
  });
});

describe('hashOtp / otpMatches', () => {
  it('never stores the code itself', () => {
    const hash = hashOtp('123456', 'user-1', SECRET);
    expect(hash).not.toContain('123456');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('matches only the right code for the right user', () => {
    const hash = hashOtp('123456', 'user-1', SECRET);
    expect(otpMatches('123456', 'user-1', hash, SECRET)).toBe(true);
    expect(otpMatches('123457', 'user-1', hash, SECRET)).toBe(false);
    expect(otpMatches('123456', 'user-2', hash, SECRET)).toBe(false);
  });

  it('depends on the server secret, so a leaked table alone is not enough to brute force', () => {
    expect(hashOtp('123456', 'user-1', SECRET)).not.toBe(hashOtp('123456', 'user-1', `${SECRET}-other`));
  });

  it('rejects malformed stored hashes without throwing', () => {
    expect(otpMatches('123456', 'user-1', 'not-hex', SECRET)).toBe(false);
  });
});

describe('nextSendAllowedAt', () => {
  it('allows sending when nothing was sent recently', () => {
    expect(nextSendAllowedAt([], at(0), policy)).toEqual({ at: at(0), reason: null });
  });

  it('enforces the 30 second cooldown after the latest send', () => {
    expect(nextSendAllowedAt([at(0)], at(10), policy)).toEqual({ at: at(30), reason: 'cooldown' });
    expect(nextSendAllowedAt([at(0)], at(30), policy)).toEqual({ at: at(30), reason: null });
  });

  it('caps sends per hour and frees the window an hour after the oldest counted send', () => {
    const sends = [at(400), at(300), at(200), at(100), at(0)];
    expect(nextSendAllowedAt(sends, at(500), policy)).toEqual({ at: at(3600), reason: 'hourly_limit' });
    expect(nextSendAllowedAt(sends, at(3601), policy).reason).toBeNull();
  });
});
