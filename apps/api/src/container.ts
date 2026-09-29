import type { AppConfig } from './config/env.js';
import type { Clock } from './lib/clock.js';
import type { Mailer } from './lib/mailer.js';
import { createBcryptHasher, type PasswordHasher } from './lib/password.js';
import { createJwtService } from './lib/tokens.js';
import { createAccountService } from './modules/account/account.service.js';
import { createAuthService } from './modules/auth/auth.service.js';
import type { OtpRepository } from './modules/otp/otp.repository.js';
import { createOtpService } from './modules/otp/otp.service.js';
import type { ProfileRepository } from './modules/profile/profile.repository.js';
import type { TasksRepository } from './modules/tasks/tasks.repository.js';
import { createTasksService } from './modules/tasks/tasks.service.js';
import type { UsersRepository } from './modules/users/users.repository.js';

export interface Repositories {
  users: UsersRepository;
  otps: OtpRepository;
  profiles: ProfileRepository;
  tasks: TasksRepository;
}

export interface ContainerDeps {
  config: Pick<AppConfig, 'auth' | 'otp'>;
  repositories: Repositories;
  mailer: Mailer;
  clock: Clock;
  passwords?: PasswordHasher;
  generateOtp?: () => string;
}

/** Wires services together. Production passes Postgres repositories; tests pass in-memory ones. */
export function createServices({ config, repositories, mailer, clock, passwords, generateOtp }: ContainerDeps) {
  const otp = createOtpService({
    repository: repositories.otps,
    mailer,
    clock,
    policy: config.otp,
    generate: generateOtp,
  });

  const auth = createAuthService({
    users: repositories.users,
    otp,
    passwords: passwords ?? createBcryptHasher(config.auth.bcryptCost),
    tokens: createJwtService(config.auth.jwtSecret, config.auth.jwtExpiresIn),
    clock,
    otpPolicy: config.otp,
  });

  const account = createAccountService({ profiles: repositories.profiles, tasks: repositories.tasks, clock });
  const tasks = createTasksService({ repository: repositories.tasks, clock });

  return { auth, otp, account, tasks };
}

export type Services = ReturnType<typeof createServices>;
