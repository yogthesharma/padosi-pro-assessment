import type { FastifyError, FastifyInstance } from 'fastify';
import { AppError } from '../lib/errors.js';

/** Maps every failure (ours, Fastify's, plugins') to the single error body shape. */
export function registerErrorHandling(app: FastifyInstance) {
  app.setErrorHandler<FastifyError | AppError>((error, request, reply) => {
    if (error instanceof AppError) {
      if (error.statusCode >= 500) request.log.error({ err: error, cause: error.cause }, error.message);
      return reply.status(error.statusCode).send(error.toBody());
    }

    if (error.code === 'FST_ERR_CTP_INVALID_JSON_BODY' || error.code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
      return reply.status(400).send(new AppError(400, 'INVALID_JSON', 'Request body must be valid JSON.').toBody());
    }

    const status = error.statusCode ?? 500;
    if (status === 429) {
      return reply.status(429).send(new AppError(429, 'RATE_LIMITED', 'Too many requests. Please slow down.').toBody());
    }
    if (status >= 400 && status < 500) {
      return reply.status(status).send(new AppError(status, 'BAD_REQUEST', error.message).toBody());
    }

    request.log.error({ err: error }, 'Unhandled error');
    return reply
      .status(500)
      .send(new AppError(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.').toBody());
  });

  app.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .send(new AppError(404, 'NOT_FOUND', `Route ${request.method} ${request.url} does not exist.`).toBody());
  });
}
