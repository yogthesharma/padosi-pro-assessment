import type { FastifyInstance } from 'fastify';
import type { Services } from '../../container.js';

/** The catalogue is public: it's the same for everyone and holds no personal data. */
export async function catalogueRoutes(app: FastifyInstance, { services }: { services: Services }) {
  app.get('/', async () => ({ categories: await services.tasks.listCatalogue() }));
}
