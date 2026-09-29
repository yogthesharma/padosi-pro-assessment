import type { FastifyRequest } from 'fastify';
import { unauthorized } from '../lib/errors.js';
import type { AuthService } from '../modules/auth/auth.service.js';
import type { User } from '../modules/users/users.repository.js';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser: User | null;
  }
}

/** preHandler hook: requires a valid `Authorization: Bearer <token>` header. */
export function createAuthGuard(auth: AuthService) {
  return async function requireAuth(request: FastifyRequest) {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw unauthorized('Please log in to continue.');
    request.currentUser = await auth.authenticate(header.slice('Bearer '.length).trim());
  };
}

export function getCurrentUser(request: FastifyRequest): User {
  if (!request.currentUser) throw unauthorized('Please log in to continue.');
  return request.currentUser;
}
