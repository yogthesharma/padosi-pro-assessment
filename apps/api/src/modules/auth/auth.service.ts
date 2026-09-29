import type { OtpPolicy } from '../../config/env.js';
import type { Clock } from '../../lib/clock.js';
import { AppError, unauthorized } from '../../lib/errors.js';
import type { PasswordHasher } from '../../lib/password.js';
import type { TokenService } from '../../lib/tokens.js';
import type { OtpSendStatus, OtpService } from '../otp/otp.service.js';
import { emailTaken, type User, type UsersRepository } from '../users/users.repository.js';

export interface AuthServiceDeps {
  users: UsersRepository;
  otp: OtpService;
  passwords: PasswordHasher;
  tokens: TokenService;
  clock: Clock;
  otpPolicy: Pick<OtpPolicy, 'resendCooldownSeconds' | 'ttlSeconds'>;
}

export interface Session {
  token: string;
  expiresAt: Date;
  user: User;
}

export interface VerificationPending extends OtpSendStatus {
  email: string;
}

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService({ users, otp, passwords, tokens, clock, otpPolicy }: AuthServiceDeps) {
  const startSession = (user: User): Session => {
    const { token, expiresAt } = tokens.sign({ sub: user.id, tv: user.tokenVersion });
    return { token, expiresAt, user };
  };

  return {
    /**
     * Creates the account and emails a code. Registering again with an email that is still
     * unverified doesn't fail: it re-sends a code (subject to the cooldown) and keeps the
     * original password, so a third party can't swap the password on someone else's pending account.
     */
    async register(email: string, password: string): Promise<VerificationPending & { created: boolean }> {
      const existing = await users.findByEmail(email);
      if (existing?.emailVerifiedAt) throw emailTaken();
      if (existing) {
        return { email, created: false, ...(await otp.ensureCodeSent(existing)) };
      }

      const user = await users.create({ email, passwordHash: await passwords.hash(password), now: clock.now() });
      return { email, created: true, ...(await otp.sendCode(user)) };
    },

    async verifyEmail(email: string, code: string): Promise<Session> {
      const user = await users.findByEmail(email);
      if (!user) {
        throw new AppError(400, 'OTP_NOT_FOUND', 'There is no active code for this email. Please request a new one.');
      }
      if (user.emailVerifiedAt) {
        throw new AppError(409, 'EMAIL_ALREADY_VERIFIED', 'This email is already verified. Please log in.');
      }
      await otp.verify(user.id, code);
      return startSession({ ...user, emailVerifiedAt: clock.now() });
    },

    /** Always answers the same way for unknown or already verified emails, so it can't be used to probe accounts. */
    async resendCode(email: string): Promise<OtpSendStatus> {
      const user = await users.findByEmail(email);
      if (!user || user.emailVerifiedAt) {
        return {
          sent: true,
          resendAvailableInSeconds: otpPolicy.resendCooldownSeconds,
          codeValidForSeconds: otpPolicy.ttlSeconds,
        };
      }
      return otp.sendCode(user);
    },

    /**
     * Unknown email and wrong password produce the same error. Only after the password is
     * proven correct do we reveal that the email still needs verification.
     */
    async login(email: string, password: string): Promise<Session> {
      const user = await users.findByEmail(email);
      const passwordOk = await passwords.verify(password, user?.passwordHash ?? '');

      if (!user || !passwordOk) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
      }

      if (!user.emailVerifiedAt) {
        const status = await otp.ensureCodeSent(user);
        throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email to continue. We have sent you a code.', {
          details: { email: user.email, ...status },
        });
      }

      return startSession(user);
    },

    async logout(userId: string): Promise<void> {
      await users.incrementTokenVersion(userId);
    },

    /** Resolves a bearer token to a verified user, rejecting expired, tampered or logged-out tokens. */
    async authenticate(token: string): Promise<User> {
      const payload = tokens.verify(token);
      if (!payload) throw unauthorized();

      const user = await users.findById(payload.sub);
      if (!user || user.tokenVersion !== payload.tv) throw unauthorized();
      if (!user.emailVerifiedAt) {
        throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email to continue.', {
          details: { email: user.email },
        });
      }
      return user;
    },
  };
}
