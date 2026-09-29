import type { OtpPolicy } from '../../config/env.js';
import { addSeconds, secondsBetween, type Clock } from '../../lib/clock.js';
import { AppError } from '../../lib/errors.js';
import type { Mailer } from '../../lib/mailer.js';
import { generateOtp, hashOtp, nextSendAllowedAt, otpMatches } from './otp.js';
import type { OtpRepository } from './otp.repository.js';

export interface OtpSendStatus {
  /** Whether a new code was sent by this call. */
  sent: boolean;
  /** Seconds until the user may request another code. */
  resendAvailableInSeconds: number;
  /** Lifetime of a code in seconds, for display ("valid for 10 minutes"). */
  codeValidForSeconds: number;
}

export interface OtpServiceDeps {
  repository: OtpRepository;
  mailer: Mailer;
  clock: Clock;
  policy: OtpPolicy & { secret: string };
  generate?: () => string;
}

export type OtpService = ReturnType<typeof createOtpService>;

export function createOtpService({ repository, mailer, clock, policy, generate = generateOtp }: OtpServiceDeps) {
  async function sendWindow(userId: string, now: Date) {
    const recentSends = await repository.listSendTimesSince(userId, addSeconds(now, -3600));
    return nextSendAllowedAt(recentSends, now, policy);
  }

  async function deliverNewCode(user: { id: string; email: string }, now: Date): Promise<OtpSendStatus> {
    const code = generate();
    await repository.invalidateActive(user.id, now);
    const record = await repository.create({
      userId: user.id,
      codeHash: hashOtp(code, user.id, policy.secret),
      expiresAt: addSeconds(now, policy.ttlSeconds),
      now,
    });

    try {
      await mailer.sendVerificationCode(user.email, code, Math.round(policy.ttlSeconds / 60));
    } catch (cause) {
      // Don't let an undelivered code start the cooldown or count toward the hourly cap.
      await repository.delete(record.id);
      throw new AppError(503, 'MAIL_DELIVERY_FAILED', "We couldn't send the verification email. Please try again.", {
        cause,
      });
    }

    return {
      sent: true,
      resendAvailableInSeconds: policy.resendCooldownSeconds,
      codeValidForSeconds: policy.ttlSeconds,
    };
  }

  return {
    /** Explicit "resend" request: rejects with 429 while the cooldown or hourly cap applies. */
    async sendCode(user: { id: string; email: string }): Promise<OtpSendStatus> {
      const now = clock.now();
      const window = await sendWindow(user.id, now);
      const waitSeconds = secondsBetween(now, window.at);

      if (window.reason === 'cooldown') {
        throw new AppError(429, 'OTP_RESEND_TOO_SOON', `Please wait ${waitSeconds} seconds before requesting a new code.`, {
          details: { retryAfterSeconds: waitSeconds },
        });
      }
      if (window.reason === 'hourly_limit') {
        const minutes = Math.ceil(waitSeconds / 60);
        throw new AppError(
          429,
          'OTP_SEND_LIMIT_REACHED',
          `Too many codes requested. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
          { details: { retryAfterSeconds: waitSeconds } },
        );
      }
      return deliverNewCode(user, now);
    },

    /**
     * Used when we route a user to verification (register again, login while unverified):
     * sends a code if allowed, otherwise reports how long until they can ask for one.
     */
    async ensureCodeSent(user: { id: string; email: string }): Promise<OtpSendStatus> {
      const now = clock.now();
      const window = await sendWindow(user.id, now);
      if (window.reason !== null) {
        return {
          sent: false,
          resendAvailableInSeconds: secondsBetween(now, window.at),
          codeValidForSeconds: policy.ttlSeconds,
        };
      }
      return deliverNewCode(user, now);
    },

    /** Checks a submitted code. Resolves on success (and marks the email verified); throws otherwise. */
    async verify(userId: string, code: string): Promise<void> {
      const now = clock.now();
      const otp = await repository.findActive(userId);

      if (!otp) {
        throw new AppError(400, 'OTP_NOT_FOUND', 'There is no active code for this email. Please request a new one.');
      }
      if (otp.expiresAt <= now) {
        throw new AppError(400, 'OTP_EXPIRED', 'This code has expired. Please request a new one.');
      }
      if (otp.attempts >= policy.maxAttempts) {
        throw tooManyAttempts();
      }

      if (!otpMatches(code, userId, otp.codeHash, policy.secret)) {
        const attempts = await repository.recordFailedAttempt(otp.id, policy.maxAttempts);
        const remaining = attempts === null ? 0 : policy.maxAttempts - attempts;
        if (remaining <= 0) throw tooManyAttempts();
        throw new AppError(
          400,
          'OTP_INVALID',
          `That code is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`,
          { details: { attemptsRemaining: remaining } },
        );
      }

      const consumed = await repository.consumeAndVerifyUser(otp.id, now, policy.maxAttempts);
      if (!consumed) {
        // Another request used, expired or locked this code between our read and write.
        throw new AppError(400, 'OTP_NOT_FOUND', 'This code is no longer valid. Please request a new one.');
      }
    },
  };
}

const tooManyAttempts = () =>
  new AppError(429, 'OTP_TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Please request a new code.', {
    details: { attemptsRemaining: 0 },
  });
