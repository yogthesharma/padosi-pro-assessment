import { beforeEach, describe, expect, it } from 'vitest';
import { createServices, type Services } from '../src/container.js';
import { AppError } from '../src/lib/errors.js';
import { createFakeClock, createFakeMailer, createInMemoryRepositories, testConfig } from './support/in-memory.js';

const EMAIL = 'ravi@example.com';
const PASSWORD = 'Sunrise2026';

async function caught(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

describe('Auth service', () => {
  let clock: ReturnType<typeof createFakeClock>;
  let mail: ReturnType<typeof createFakeMailer>;
  let store: ReturnType<typeof createInMemoryRepositories>;
  let services: Services;

  const registerAndVerify = async () => {
    await services.auth.register(EMAIL, PASSWORD);
    return services.auth.verifyEmail(EMAIL, mail.lastCodeFor(EMAIL)!);
  };

  beforeEach(() => {
    clock = createFakeClock();
    mail = createFakeMailer();
    store = createInMemoryRepositories();
    services = createServices({ config: testConfig, repositories: store.repositories, mailer: mail.mailer, clock });
  });

  describe('register', () => {
    it('stores a bcrypt hash, never the password, and emails a code', async () => {
      const result = await services.auth.register(EMAIL, PASSWORD);
      const user = await store.repositories.users.findByEmail(EMAIL);

      expect(result).toMatchObject({ email: EMAIL, created: true, sent: true });
      expect(user!.passwordHash).not.toContain(PASSWORD);
      expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(mail.lastCodeFor(EMAIL)).toMatch(/^\d{6}$/);
    });

    it('rejects an email that already belongs to a verified account', async () => {
      await registerAndVerify();
      const error = await caught(services.auth.register(EMAIL, PASSWORD));
      expect(error.code).toBe('EMAIL_ALREADY_REGISTERED');
      expect(error.statusCode).toBe(409);
    });

    it('re-sends a code for a pending account but keeps the original password', async () => {
      await services.auth.register(EMAIL, PASSWORD);
      clock.advanceSeconds(31);

      const again = await services.auth.register(EMAIL, 'Different123');
      expect(again).toMatchObject({ created: false, sent: true });

      await services.auth.verifyEmail(EMAIL, mail.lastCodeFor(EMAIL)!);
      await expect(services.auth.login(EMAIL, PASSWORD)).resolves.toMatchObject({ user: { email: EMAIL } });
      expect((await caught(services.auth.login(EMAIL, 'Different123'))).code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('login rules', () => {
    it('logs in a verified user and returns a token that authenticates', async () => {
      await registerAndVerify();
      const session = await services.auth.login(EMAIL, PASSWORD);

      expect(session.token).toBeTruthy();
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
      await expect(services.auth.authenticate(session.token)).resolves.toMatchObject({ email: EMAIL });
    });

    it('gives the same answer for an unknown email and a wrong password', async () => {
      await registerAndVerify();
      const unknown = await caught(services.auth.login('nobody@example.com', PASSWORD));
      const wrong = await caught(services.auth.login(EMAIL, 'WrongPass1'));

      expect(unknown.code).toBe('INVALID_CREDENTIALS');
      expect(wrong.code).toBe('INVALID_CREDENTIALS');
      expect(unknown.statusCode).toBe(401);
      expect(unknown.message).toBe(wrong.message);
    });

    it('sends an unverified user back to verification with a fresh code', async () => {
      await services.auth.register(EMAIL, PASSWORD);
      clock.advanceSeconds(31);

      const error = await caught(services.auth.login(EMAIL, PASSWORD));
      expect(error.code).toBe('EMAIL_NOT_VERIFIED');
      expect(error.statusCode).toBe(403);
      expect(error.options.details).toMatchObject({ email: EMAIL, sent: true, resendAvailableInSeconds: 30 });
      expect(mail.sent).toHaveLength(2);
    });

    it('respects the resend cooldown when an unverified user logs in again quickly', async () => {
      await services.auth.register(EMAIL, PASSWORD);
      clock.advanceSeconds(5);

      const error = await caught(services.auth.login(EMAIL, PASSWORD));
      expect(error.options.details).toMatchObject({ sent: false, resendAvailableInSeconds: 25 });
      expect(mail.sent).toHaveLength(1);
    });

    it('does not reveal an unverified account to someone with the wrong password', async () => {
      await services.auth.register(EMAIL, PASSWORD);
      const error = await caught(services.auth.login(EMAIL, 'WrongPass1'));
      expect(error.code).toBe('INVALID_CREDENTIALS');
    });

    it('logs the user in straight after verification', async () => {
      const session = await registerAndVerify();
      await expect(services.auth.authenticate(session.token)).resolves.toMatchObject({ email: EMAIL });
    });
  });

  describe('sessions', () => {
    it('stops accepting a token after logout', async () => {
      const session = await registerAndVerify();
      await services.auth.logout(session.user.id);
      expect((await caught(services.auth.authenticate(session.token))).code).toBe('UNAUTHORIZED');
    });

    it('rejects tampered tokens', async () => {
      const session = await registerAndVerify();
      const [header, payload] = session.token.split('.');
      expect((await caught(services.auth.authenticate(`${header}.${payload}.forged`))).code).toBe('UNAUTHORIZED');
      expect((await caught(services.auth.authenticate('not-a-jwt'))).code).toBe('UNAUTHORIZED');
    });
  });

  describe('resend', () => {
    it('answers identically for unknown emails, without sending anything', async () => {
      await expect(services.auth.resendCode('ghost@example.com')).resolves.toMatchObject({ sent: true });
      expect(mail.sent).toHaveLength(0);
    });
  });
});
