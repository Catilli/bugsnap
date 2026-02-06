import Fastify, { FastifyInstance, FastifyError } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { AppError } from '../../utils/errors';
import { authPlugin } from '../../plugins/auth';
import { authRoutes } from '../../routes/auth';
import { projectRoutes } from '../../routes/projects';
import { issueRoutes } from '../../routes/issues';

const TEST_JWT_SECRET = 'test-jwt-secret-for-testing';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  // Set error handler directly on root instance so it covers all routes
  app.setErrorHandler((error: FastifyError | AppError | Error, _request, reply) => {
    if (error.name === 'ZodError' && 'issues' in error) {
      const zodError = error as any;
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: zodError.errors.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    if ('statusCode' in error) {
      return reply.status(error.statusCode || 500).send({
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }

    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  });

  app.register(cors, { origin: true });
  app.register(fastifyJwt, { secret: TEST_JWT_SECRET });
  app.register(authPlugin);
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(projectRoutes, { prefix: '/api' });
  app.register(issueRoutes, { prefix: '/api' });

  await app.ready();
  return app;
}

/**
 * Sign a test JWT with the test secret. Use this to generate tokens for
 * authenticated test requests.
 */
export function signTestToken(app: FastifyInstance, payload: { id: string; email: string; role: string }) {
  return app.jwt.sign(payload, { expiresIn: '1h' });
}
