import { randomUUID } from 'node:crypto';
import type { Repositories } from '../../src/container.js';
import { catalogue } from '../../src/db/catalogue.js';
import type { Mailer } from '../../src/lib/mailer.js';
import type { OtpRecord, OtpRepository } from '../../src/modules/otp/otp.repository.js';
import type { Profile, ProfileRepository } from '../../src/modules/profile/profile.repository.js';
import type { SelectedTask, TasksRepository } from '../../src/modules/tasks/tasks.repository.js';
import { emailTaken, type User, type UsersRepository } from '../../src/modules/users/users.repository.js';

/** In-memory stand-ins that honour the same contracts (including the atomic guards) as the Postgres repositories. */
export function createInMemoryRepositories() {
  const users = new Map<string, User>();
  const otps: OtpRecord[] = [];
  const profiles = new Map<string, Profile>();
  const selections = new Map<string, string[]>();

  const usersRepo: UsersRepository = {
    async findByEmail(email) {
      return [...users.values()].find((user) => user.email === email) ?? null;
    },
    async findById(id) {
      return users.get(id) ?? null;
    },
    async create({ email, passwordHash, now }) {
      if ([...users.values()].some((user) => user.email === email)) throw emailTaken();
      const user: User = { id: randomUUID(), email, passwordHash, emailVerifiedAt: null, tokenVersion: 0, createdAt: now };
      users.set(user.id, user);
      return { ...user };
    },
    async incrementTokenVersion(id) {
      const user = users.get(id);
      if (user) user.tokenVersion += 1;
    },
  };

  const otpRepo: OtpRepository = {
    async create({ userId, codeHash, expiresAt, now }) {
      const record: OtpRecord = { id: randomUUID(), userId, codeHash, expiresAt, attempts: 0, consumedAt: null, createdAt: now };
      otps.push(record);
      return { ...record };
    },
    async findActive(userId) {
      const active = otps
        .filter((otp) => otp.userId === userId && otp.consumedAt === null)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return active[0] ? { ...active[0] } : null;
    },
    async invalidateActive(userId, now) {
      for (const otp of otps) if (otp.userId === userId && otp.consumedAt === null) otp.consumedAt = now;
    },
    async delete(id) {
      const index = otps.findIndex((otp) => otp.id === id);
      if (index >= 0) otps.splice(index, 1);
    },
    async listSendTimesSince(userId, since) {
      return otps
        .filter((otp) => otp.userId === userId && otp.createdAt > since)
        .map((otp) => otp.createdAt)
        .sort((a, b) => b.getTime() - a.getTime());
    },
    async recordFailedAttempt(id, maxAttempts) {
      const otp = otps.find((candidate) => candidate.id === id);
      if (!otp || otp.consumedAt !== null || otp.attempts >= maxAttempts) return null;
      otp.attempts += 1;
      return otp.attempts;
    },
    async consumeAndVerifyUser(id, now, maxAttempts) {
      const otp = otps.find((candidate) => candidate.id === id);
      if (!otp || otp.consumedAt !== null || otp.attempts >= maxAttempts || otp.expiresAt <= now) return false;
      otp.consumedAt = now;
      const user = users.get(otp.userId);
      if (user) user.emailVerifiedAt = now;
      return true;
    },
  };

  const profilesRepo: ProfileRepository = {
    async findByUserId(userId) {
      return profiles.get(userId) ?? null;
    },
    async upsert(userId, input, now) {
      const profile: Profile = { userId, ...input, updatedAt: now };
      profiles.set(userId, profile);
      return profile;
    },
  };

  const allTasks = catalogue.flatMap((category) =>
    category.tasks.map((task) => ({ ...task, category: { id: category.id, name: category.name, icon: category.icon } })),
  );

  const tasksRepo: TasksRepository = {
    async listCatalogue() {
      return catalogue.map(({ tasks, ...category }) => ({ ...category, tasks: tasks.map((task) => ({ ...task })) }));
    },
    async findExistingIds(ids) {
      return allTasks.filter((task) => ids.includes(task.id)).map((task) => task.id);
    },
    async listSelected(userId) {
      const selected = new Set(selections.get(userId) ?? []);
      return allTasks.filter((task) => selected.has(task.id)) as SelectedTask[];
    },
    async countSelected(userId) {
      return (selections.get(userId) ?? []).length;
    },
    async replaceSelection(userId, taskIds) {
      selections.set(userId, [...taskIds]);
    },
  };

  const repositories: Repositories = { users: usersRepo, otps: otpRepo, profiles: profilesRepo, tasks: tasksRepo };
  return { repositories, state: { users, otps, profiles, selections } };
}

export function createFakeClock(start = new Date('2026-09-29T10:00:00.000Z')) {
  let current = new Date(start);
  return {
    now: () => new Date(current),
    advanceSeconds(seconds: number) {
      current = new Date(current.getTime() + seconds * 1000);
    },
  };
}

/** Captures outgoing emails so tests can read the code the user would receive. */
export function createFakeMailer() {
  const sent: { to: string; code: string }[] = [];
  let failNext = false;
  const mailer: Mailer = {
    async sendVerificationCode(to, code) {
      if (failNext) {
        failNext = false;
        throw new Error('SMTP connection refused');
      }
      sent.push({ to, code });
    },
  };
  return {
    mailer,
    sent,
    lastCodeFor: (email: string) => [...sent].reverse().find((mail) => mail.to === email)?.code,
    failNextSend: () => {
      failNext = true;
    },
  };
}

export const testConfig = {
  auth: {
    jwtSecret: 'test-jwt-secret-that-is-at-least-32-characters',
    jwtExpiresIn: '7d',
    bcryptCost: 4,
    rateLimitPerMinute: 1000,
  },
  otp: {
    secret: 'test-otp-secret-that-is-at-least-32-characters',
    ttlSeconds: 600,
    maxAttempts: 5,
    resendCooldownSeconds: 30,
    maxSendsPerHour: 5,
  },
};
