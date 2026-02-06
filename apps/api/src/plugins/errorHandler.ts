import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';

const errorHandlerFn: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError | AppError | ZodError, _request, reply) => {
    // Log error
    fastify.log.error(error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
      });
    }

    // Handle custom AppError
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    // Handle Fastify errors
    if ('statusCode' in error) {
      return reply.status(error.statusCode || 500).send({
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }

    // Handle unknown errors
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : error.message,
      },
    });
  });
};

export const errorHandler = fp(errorHandlerFn, { name: 'error-handler' });