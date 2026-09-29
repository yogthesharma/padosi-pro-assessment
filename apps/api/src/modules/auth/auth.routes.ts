import { loginSchema, registerSchema, resendCodeSchema, verifyEmailSchema } from '@padosipro/shared';
import type { FastifyInstance } from 'fastify';
import type { Services } from '../../container.js';
import { createAuthGuard, getCurrentUser } from '../../http/auth-guard.js';
import { parseInput } from '../../lib/validation.js';

export async function authRoutes(
  app: FastifyInstance,
  { services, rateLimitPerMinute }: { services: Services; rateLimitPerMinute: number },
) {
  const { auth, account } = services;
  const rateLimited = { config: { rateLimit: { max: rateLimitPerMinute, timeWindow: '1 minute' } } };

  app.post('/register', rateLimited, async (request, reply) => {
    const { email, password } = parseInput(registerSchema, request.body);
    const { created, ...pending } = await auth.register(email, password);
    return reply.status(created ? 201 : 200).send({ verificationRequired: true, ...pending });
  });

  app.post('/verify-email', rateLimited, async (request) => {
    const { email, code } = parseInput(verifyEmailSchema, request.body);
    const session = await auth.verifyEmail(email, code);
    return { token: session.token, expiresAt: session.expiresAt, ...(await account.getAccount(session.user)) };
  });

  app.post('/resend-code', rateLimited, async (request) => {
    const { email } = parseInput(resendCodeSchema, request.body);
    const { resendAvailableInSeconds, codeValidForSeconds } = await auth.resendCode(email);
    return { message: 'If this email needs verification, a new code is on its way.', resendAvailableInSeconds, codeValidForSeconds };
  });

  app.post('/login', rateLimited, async (request) => {
    const { email, password } = parseInput(loginSchema, request.body);
    const session = await auth.login(email, password);
    return { token: session.token, expiresAt: session.expiresAt, ...(await account.getAccount(session.user)) };
  });

  app.post('/logout', { preHandler: createAuthGuard(auth) }, async (request, reply) => {
    await auth.logout(getCurrentUser(request).id);
    return reply.status(204).send();
  });
}
