import Fastify, { FastifyInstance, FastifyError } from 'fastify';
import cors from '@fastify/cors';
import { AppError } from '../../utils/errors';
import { clerkAuthPlugin } from '../../plugins/clerkAuth';
import { authRoutes } from '../../routes/auth';
import { projectRoutes } from '../../routes/projects';
import { taskRoutes } from '../../routes/tasks';

/**
 * Build a Fastify instance for testing.
 * Registers CORS, error handler, Clerk auth plugin, and route modules.
 * Rate limiting is NOT registered to avoid interference with tests.
 * Error handler is set directly on root (not via register) to avoid encapsulation.
 *
 * Tests should mock @clerk/backend verifyToken to return test payloads.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  // Set error handler directly on root instance so it covers all routes
  app.setErrorHandler((error: FastifyError | AppError | Error, _request, reply) => {
    // Check for ZodError by name (avoids cross-module instanceof issues)
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
  app.register(clerkAuthPlugin);
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(projectRoutes, { prefix: '/api' });
  app.register(taskRoutes, { prefix: '/api' });

  await app.ready();
  return app;
}

/**
 * A dummy token string for tests. Tests must mock @clerk/backend verifyToken
 * to resolve to a valid payload when this token is passed.
 */
export const TEST_TOKEN = 'test-clerk-token';
