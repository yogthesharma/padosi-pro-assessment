import { existsSync } from 'node:fs';
import { buildApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createServices } from './container.js';
import { runMigrations } from './db/migrate.js';
import { createPool, waitForDatabase } from './db/pool.js';
import { seedCatalogue } from './db/seed.js';
import { systemClock } from './lib/clock.js';
import { createSmtpMailer } from './lib/mailer.js';
import { createPgOtpRepository } from './modules/otp/otp.repository.js';
import { createPgProfileRepository } from './modules/profile/profile.repository.js';
import { createPgTasksRepository } from './modules/tasks/tasks.repository.js';
import { createPgUsersRepository } from './modules/users/users.repository.js';

if (existsSync('.env')) process.loadEnvFile('.env');

async function main() {
  const config = loadConfig();
  const pool = createPool(config.databaseUrl);

  await waitForDatabase(pool);
  await runMigrations(pool);
  await seedCatalogue(pool);

  const services = createServices({
    config,
    repositories: {
      users: createPgUsersRepository(pool),
      otps: createPgOtpRepository(pool),
      profiles: createPgProfileRepository(pool),
      tasks: createPgTasksRepository(pool),
    },
    mailer: createSmtpMailer(config.smtp),
    clock: systemClock,
  });

  const app = await buildApp({
    services,
    rateLimitPerMinute: config.auth.rateLimitPerMinute,
    logger: {
      level: config.logLevel,
      redact: ['req.headers.authorization', 'req.body.password', 'req.body.code'],
      transport: config.logPretty
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down`);
    await app.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: config.port, host: '0.0.0.0' });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
