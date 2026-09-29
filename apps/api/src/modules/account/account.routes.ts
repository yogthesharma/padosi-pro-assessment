import { profileSchema, selectTasksSchema } from '@padosipro/shared';
import type { FastifyInstance } from 'fastify';
import type { Services } from '../../container.js';
import { createAuthGuard, getCurrentUser } from '../../http/auth-guard.js';
import { parseInput } from '../../lib/validation.js';

/** Everything under /api/me belongs to the logged-in user. */
export async function accountRoutes(app: FastifyInstance, { services }: { services: Services }) {
  const { auth, account, tasks } = services;
  app.addHook('preHandler', createAuthGuard(auth));

  app.get('/', async (request) => account.getAccount(getCurrentUser(request)));

  app.put('/profile', async (request) => {
    const user = getCurrentUser(request);
    await account.saveProfile(user.id, parseInput(profileSchema, request.body));
    return account.getAccount(user);
  });

  app.get('/tasks', async (request) => ({ tasks: await tasks.listSelected(getCurrentUser(request).id) }));

  app.put('/tasks', async (request) => {
    const { taskIds } = parseInput(selectTasksSchema, request.body);
    return { tasks: await tasks.saveSelection(getCurrentUser(request).id, taskIds) };
  });
}
