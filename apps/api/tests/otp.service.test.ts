import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../src/lib/errors.js';
import { createOtpService, type OtpService } from '../src/modules/otp/otp.service.js';
import type { User } from '../src/modules/users/users.repository.js';
import { createFakeClock, createFakeMailer, createInMemoryRepositories, testConfig } from './support/in-memory.js';

async function expectAppError(promise: Promise<unknown>, code: string, status?: number) {
  const error = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  expect(error, `expected ${code} to be thrown`).toBeInstanceOf(AppError);
  expect((error as AppError).code).toBe(code);
  if (status) expect((error as AppError).statusCode).toBe(status);
  return error as AppError;
}

describe('OTP service', () => {
  let clock: ReturnType<typeof createFakeClock>;
  let mail: ReturnType<typeof createFakeMailer>;
  let store: ReturnType<typeof createInMemoryRepositories>;
  let otp: OtpService;
  let user: User;

  const wrongCode = () => (mail.lastCodeFor(user.email) === '000000' ? '111111' : '000000');

  beforeEach(async () => {
    clock = createFakeClock();
    mail = createFakeMailer();
    store = createInMemoryRepositories();
    otp = createOtpService({ repository: store.repositories.otps, mailer: mail.mailer, clock, policy: testConfig.otp });
    user = await store.repositories.users.create({ email: 'asha@example.com', passwordHash: 'x', now: clock.now() });
  });

  describe('sending', () => {
    it('emails a 6-digit code and stores only its hash', async () => {
      const status = await otp.sendCode(user);
      const code = mail.lastCodeFor(user.email)!;

      expect(code).toMatch(/^\d{6}$/);
      expect(status).toEqual({ sent: true, resendAvailableInSeconds: 30, codeValidForSeconds: 600 });
      expect(store.state.otps).toHaveLength(1);
      expect(store.state.otps[0]!.codeHash).not.toContain(code);
    });

    it('rejects a resend inside the 30 second cooldown, then allows it', async () => {
      await otp.sendCode(user);
      clock.advanceSeconds(10);

      const error = await expectAppError(otp.sendCode(user), 'OTP_RESEND_TOO_SOON', 429);
      expect(error.options.details).toEqual({ retryAfterSeconds: 20 });

      clock.advanceSeconds(20);
      await expect(otp.sendCode(user)).resolves.toMatchObject({ sent: true });
      expect(mail.sent).toHaveLength(2);
    });

    it('invalidates the previous code when a new one is sent', async () => {
      await otp.sendCode(user);
      const firstCode = mail.lastCodeFor(user.email)!;
      clock.advanceSeconds(31);
      await otp.sendCode(user);
      const secondCode = mail.lastCodeFor(user.email)!;

      if (firstCode !== secondCode) {
        await expectAppError(otp.verify(user.id, firstCode), 'OTP_INVALID');
      }
      await expect(otp.verify(user.id, secondCode)).resolves.toBeUndefined();
    });

    it('caps codes per hour to stop inbox flooding', async () => {
      for (let i = 0; i < testConfig.otp.maxSendsPerHour; i++) {
        await otp.sendCode(user);
        clock.advanceSeconds(31);
      }
      await expectAppError(otp.sendCode(user), 'OTP_SEND_LIMIT_REACHED', 429);
    });

    it('does not start the cooldown when the email could not be delivered', async () => {
      mail.failNextSend();
      await expectAppError(otp.sendCode(user), 'MAIL_DELIVERY_FAILED', 503);
      expect(store.state.otps).toHaveLength(0);
      await expect(otp.sendCode(user)).resolves.toMatchObject({ sent: true });
    });

    it('ensureCodeSent reports the remaining cooldown instead of failing', async () => {
      await otp.sendCode(user);
      clock.advanceSeconds(12);
      await expect(otp.ensureCodeSent(user)).resolves.toEqual({
        sent: false,
        resendAvailableInSeconds: 18,
        codeValidForSeconds: 600,
      });
      expect(mail.sent).toHaveLength(1);
    });
  });

  describe('verifying', () => {
    it('accepts the correct code and marks the email verified', async () => {
      await otp.sendCode(user);
      await otp.verify(user.id, mail.lastCodeFor(user.email)!);
      expect(store.state.users.get(user.id)!.emailVerifiedAt).toEqual(clock.now());
    });

    it('is single use', async () => {
      await otp.sendCode(user);
      const code = mail.lastCodeFor(user.email)!;
      await otp.verify(user.id, code);
      await expectAppError(otp.verify(user.id, code), 'OTP_NOT_FOUND');
    });

    it('still accepts the code a second before the 10 minutes are up', async () => {
      await otp.sendCode(user);
      clock.advanceSeconds(599);
      await expect(otp.verify(user.id, mail.lastCodeFor(user.email)!)).resolves.toBeUndefined();
    });

    it('rejects an expired code with a clear error', async () => {
      await otp.sendCode(user);
      clock.advanceSeconds(600);
      await expectAppError(otp.verify(user.id, mail.lastCodeFor(user.email)!), 'OTP_EXPIRED', 400);
    });

    it('counts down remaining attempts on wrong codes', async () => {
      await otp.sendCode(user);
      const first = await expectAppError(otp.verify(user.id, wrongCode()), 'OTP_INVALID', 400);
      expect(first.options.details).toEqual({ attemptsRemaining: 4 });
      const second = await expectAppError(otp.verify(user.id, wrongCode()), 'OTP_INVALID', 400);
      expect(second.options.details).toEqual({ attemptsRemaining: 3 });
    });

    it('locks the code after 5 wrong attempts, even if the right code comes next', async () => {
      await otp.sendCode(user);
      const code = mail.lastCodeFor(user.email)!;

      for (let i = 0; i < 4; i++) await expectAppError(otp.verify(user.id, wrongCode()), 'OTP_INVALID');
      await expectAppError(otp.verify(user.id, wrongCode()), 'OTP_TOO_MANY_ATTEMPTS', 429);
      await expectAppError(otp.verify(user.id, code), 'OTP_TOO_MANY_ATTEMPTS', 429);
      expect(store.state.users.get(user.id)!.emailVerifiedAt).toBeNull();
    });

    it('does not let concurrent wrong guesses go past the attempt cap', async () => {
      await otp.sendCode(user);
      await Promise.allSettled(Array.from({ length: 20 }, () => otp.verify(user.id, wrongCode())));
      expect(store.state.otps[0]!.attempts).toBe(testConfig.otp.maxAttempts);
    });

    it('lets the user recover with a fresh code after being locked out', async () => {
      await otp.sendCode(user);
      for (let i = 0; i < 5; i++) await otp.verify(user.id, wrongCode()).catch(() => {});

      clock.advanceSeconds(31);
      await otp.sendCode(user);
      await expect(otp.verify(user.id, mail.lastCodeFor(user.email)!)).resolves.toBeUndefined();
    });

    it('explains when there is no code to check', async () => {
      await expectAppError(otp.verify(user.id, '123456'), 'OTP_NOT_FOUND', 400);
    });
  });
});
