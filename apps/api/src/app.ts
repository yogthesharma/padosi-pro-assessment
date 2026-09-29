import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyServerOptions } from 'fastify';
import type { Services } from './container.js';
import { registerErrorHandling } from './http/error-handler.js';
import { AppError } from './lib/errors.js';
import { accountRoutes } from './modules/account/account.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { catalogueRoutes } from './modules/tasks/tasks.routes.js';

export interface AppOptions {
  services: Services;
  rateLimitPerMinute: number;
  logger?: FastifyServerOptions['logger'];
}

export async function buildApp({ services, rateLimitPerMinute, logger = false }: AppOptions) {
  const app = Fastify({ logger, bodyLimit: 16 * 1024 });

  app.decorateRequest('currentUser', null);
  registerErrorHandling(app);

  await app.register(helmet);
  // The mobile app isn't a browser, so CORS only matters for local tooling; allow any origin, no cookies.
  await app.register(cors, { origin: true, credentials: false, methods: ['GET', 'POST', 'PUT', 'OPTIONS'] });
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: (_request, context) =>
      new AppError(429, 'RATE_LIMITED', `Too many requests. Please try again in ${context.after}.`),
  });

  app.get('/health', { logLevel: 'silent' }, async () => ({ status: 'ok' }));

  await app.register(authRoutes, { prefix: '/api/auth', services, rateLimitPerMinute });
  await app.register(accountRoutes, { prefix: '/api/me', services });
  await app.register(catalogueRoutes, { prefix: '/api/tasks', services });

  return app;
}
