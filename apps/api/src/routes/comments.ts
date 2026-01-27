import { FastifyPluginAsync } from 'fastify';
import { validateBody } from '../middleware/validate';
import { createCommentSchema } from '@bugsnap/shared';

export const commentRoutes: FastifyPluginAsync = async (fastify) => {
  // All comment routes require authentication
  // fastify.addHook('preHandler', fastify.authenticate);

  // POST /api/reports/:reportId/comments
  fastify.post(
    '/reports/:reportId',
    {
      preHandler: validateBody(createCommentSchema),
    },
    async (request, reply) => {
      // TODO: Implement create comment logic
      return reply.status(501).send({ message: 'Not implemented yet' });
    }
  );

  // GET /api/reports/:reportId/comments
  fastify.get('/reports/:reportId', async (request, reply) => {
    // TODO: Implement get comments logic
    return reply.status(501).send({ message: 'Not implemented yet' });
  });

  // PATCH /api/comments/:id
  fastify.patch('/:id', async (request, reply) => {
    // TODO: Implement update comment logic
    return reply.status(501).send({ message: 'Not implemented yet' });
  });

  // DELETE /api/comments/:id
  fastify.delete('/:id', async (request, reply) => {
    // TODO: Implement delete comment logic
    return reply.status(501).send({ message: 'Not implemented yet' });
  });
};