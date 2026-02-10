import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { notificationService } from '../services/notificationService';

const categoryEnum = z.enum(['issue', 'feedback']);

const notificationQuerySchema = z.object({
  unread: z.enum(['true', 'false']).optional(),
  category: categoryEnum.optional(),
});

const readAllBodySchema = z.object({
  category: categoryEnum.optional(),
}).optional();

export async function notificationRoutes(fastify: FastifyInstance) {
  // Get notifications for current user
  fastify.get('/notifications', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const { unread, category } = notificationQuerySchema.parse(request.query);
      const notifications = await notificationService.getForUser(userId, unread === 'true', category);
      return reply.send(notifications);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch notifications' });
    }
  });

  // Mark a notification as read
  fastify.patch('/notifications/:id/read', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };
      await notificationService.markRead(id, userId);
      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to mark notification as read' });
    }
  });

  // Mark all notifications as read
  fastify.post('/notifications/read-all', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const parsed = readAllBodySchema.parse(request.body);
      await notificationService.markAllRead(userId, parsed?.category);
      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to mark all notifications as read' });
    }
  });
}
