import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { OTP_LENGTH } from '@padosipro/shared';
import type { OtpPolicy } from '../../config/env.js';
import { addSeconds } from '../../lib/clock.js';

/** Cryptographically secure 6-digit code, zero padded ("000042" is valid). */
export function generateOtp(random: (min: number, max: number) => number = randomInt): string {
  return random(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

/**
 * Codes are stored as HMAC-SHA256(secret, userId:code), never in plain text.
 * A plain SHA-256 of a 6-digit code could be reversed by trying all 1,000,000 values;
 * the server-side secret makes a leaked table useless on its own, and binding the
 * user id means a hash can't be replayed against another account.
 */
export function hashOtp(code: string, userId: string, secret: string): string {
  return createHmac('sha256', secret).update(`${userId}:${code}`).digest('hex');
}

export function otpMatches(code: string, userId: string, storedHash: string, secret: string): boolean {
  const candidate = Buffer.from(hashOtp(code, userId, secret), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

/**
 * When may the next code be sent? Enforces both the short resend cooldown and the hourly cap.
 * `recentSends` are the creation times of codes sent in the last hour, newest first.
 */
export function nextSendAllowedAt(
  recentSends: Date[],
  now: Date,
  policy: Pick<OtpPolicy, 'resendCooldownSeconds' | 'maxSendsPerHour'>,
): { at: Date; reason: 'cooldown' | 'hourly_limit' | null } {
  const [latest] = recentSends;
  if (!latest) return { at: now, reason: null };

  const cooldownUntil = addSeconds(latest, policy.resendCooldownSeconds);
  const oneHourAgo = addSeconds(now, -3600);
  const sendsInWindow = recentSends.filter((sentAt) => sentAt > oneHourAgo);

  let hourlyUntil = now;
  if (sendsInWindow.length >= policy.maxSendsPerHour) {
    // The window frees up one hour after the oldest send that still counts toward the cap.
    const oldestCounted = sendsInWindow[policy.maxSendsPerHour - 1]!;
    hourlyUntil = addSeconds(oldestCounted, 3600);
  }

  if (hourlyUntil > now && hourlyUntil >= cooldownUntil) return { at: hourlyUntil, reason: 'hourly_limit' };
  if (cooldownUntil > now) return { at: cooldownUntil, reason: 'cooldown' };
  return { at: now, reason: null };
}
