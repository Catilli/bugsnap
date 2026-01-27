import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      throw error; // Will be caught by error handler
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query);
    } catch (error) {
      throw error;
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.params = schema.parse(request.params);
    } catch (error) {
      throw error;
    }
  };
};