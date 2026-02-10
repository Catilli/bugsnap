import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { requireRole } from '../middleware/requireRole';
import { sanitizeString } from '../utils/sanitize';
import { logActivity } from '../utils/activityLogger';
import { notificationService } from '../services/notificationService';
import { emitFeedbackEvent } from '../lib/eventBus';

const createFeedbackSchema = z.object({
  type: z.enum(['BUG', 'FEATURE']),
  title: z.string().min(1, 'Title is required').transform(sanitizeString),
  description: z.string().transform(sanitizeString).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const updateFeedbackSchema = z.object({
  title: z.string().min(1).transform(sanitizeString).optional(),
  description: z.string().transform(sanitizeString).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z.enum(['BUG', 'FEATURE']).optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').transform(sanitizeString),
});

const feedbackQuerySchema = z.object({
  type: z.string().max(50).optional(),
  status: z.string().max(100).optional(),
  priority: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
});

export async function feedbackRoutes(fastify: FastifyInstance) {
  // Create new feedback
  fastify.post('/', {
    preHandler: [
      async (request, reply) => {
        try {
          await fastify.authenticate(request, reply);
        } catch (err) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      },
      requireRole('DEVELOPER'),
    ],
  }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const data = createFeedbackSchema.parse(request.body);

      // Get the last feedback of this type to determine next number
      const lastFeedback = await prisma.feedback.findFirst({
        where: { type: data.type },
        orderBy: { createdAt: 'desc' },
      });

      const typePrefix = data.type === 'BUG' ? 'Bug' : 'Feature';
      let nextNumber = 1;

      if (lastFeedback) {
        const match = lastFeedback.title.match(/(Bug|Feature) #(\d+)/);
        if (match) {
          nextNumber = parseInt(match[2]) + 1;
        }
      }

      const feedback = await prisma.feedback.create({
        data: {
          type: data.type,
          title: `${typePrefix} #${nextNumber} - ${data.title}`,
          description: data.description,
          priority: data.priority,
          createdById: userId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log activity
      logActivity({
        feedbackId: feedback.id,
        userId,
        action: 'created',
        metadata: { type: data.type, title: feedback.title },
      });

      emitFeedbackEvent({ type: 'feedback:created', data: feedback as any });

      return reply.status(201).send(feedback);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid feedback data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to create feedback' });
    }
  });

  // Get all feedback with filters
  fastify.get('/', {
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

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { type, status, priority, search } = feedbackQuerySchema.parse(request.query);

      const whereClause: any = {};

      // Filter by type (comma-separated)
      if (type) {
        const types = type.split(',').filter(Boolean);
        if (types.length > 0) {
          whereClause.type = { in: types };
        }
      }

      // Filter by status (comma-separated)
      if (status) {
        const statuses = status.split(',').filter(Boolean);
        if (statuses.length > 0) {
          whereClause.status = { in: statuses };
        }
      }

      // Filter by priority (comma-separated)
      if (priority) {
        const priorities = priority.split(',').filter(Boolean);
        if (priorities.length > 0) {
          whereClause.priority = { in: priorities };
        }
      }

      // Search in title and description
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const feedbackList = await prisma.feedback.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(feedbackList);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch feedback' });
    }
  });

  // Get a specific feedback with comments
  fastify.get('/:feedbackId', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { feedbackId } = request.params as { feedbackId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!feedback) {
        return reply.status(404).send({ error: 'Feedback not found' });
      }

      return reply.send(feedback);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch feedback' });
    }
  });

  // Update feedback
  fastify.patch('/:feedbackId', {
    preHandler: [
      async (request, reply) => {
        try {
          await fastify.authenticate(request, reply);
        } catch (err) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      },
      requireRole('DEVELOPER'),
    ],
  }, async (request, reply) => {
    try {
      const { feedbackId } = request.params as { feedbackId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const updateData = updateFeedbackSchema.parse(request.body);

      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        return reply.status(404).send({ error: 'Feedback not found' });
      }

      const updatedFeedback = await prisma.feedback.update({
        where: { id: feedbackId },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log activity for each changed field
      for (const [field, newValue] of Object.entries(updateData)) {
        const oldValue = (feedback as any)[field];
        if (oldValue !== newValue) {
          logActivity({
            feedbackId,
            userId,
            action: field === 'status' ? 'status_changed' : 'updated',
            field,
            oldValue: oldValue != null ? String(oldValue) : undefined,
            newValue: newValue != null ? String(newValue) : undefined,
          });
        }
      }

      // Notify feedback creator on status change (if someone else changed it)
      if (updateData.status && feedback.createdById !== userId) {
        notificationService.create({
          userId: feedback.createdById,
          type: 'status_changed',
          title: `Feedback status changed to ${updateData.status}`,
          message: feedback.title,
          feedbackId,
        });
      }

      emitFeedbackEvent({ type: 'feedback:updated', data: updatedFeedback as any });

      return reply.send(updatedFeedback);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid feedback data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to update feedback' });
    }
  });

  // Delete feedback
  fastify.delete('/:feedbackId', {
    preHandler: [
      async (request, reply) => {
        try {
          await fastify.authenticate(request, reply);
        } catch (err) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      },
      requireRole('DEVELOPER'),
    ],
  }, async (request, reply) => {
    try {
      const { feedbackId } = request.params as { feedbackId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        return reply.status(404).send({ error: 'Feedback not found' });
      }

      // Only the creator can delete feedback
      if (feedback.createdById !== userId) {
        return reply.status(403).send({ error: 'Only the feedback creator can delete this feedback' });
      }

      // Log activity before deletion
      logActivity({
        feedbackId,
        userId,
        action: 'deleted',
        metadata: { title: feedback.title },
      });

      await prisma.feedback.delete({
        where: { id: feedbackId },
      });

      emitFeedbackEvent({ type: 'feedback:deleted', data: { id: feedbackId } });

      return reply.send({ message: 'Feedback deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete feedback' });
    }
  });

  // Add comment to feedback
  fastify.post('/:feedbackId/comments', {
    preHandler: [
      async (request, reply) => {
        try {
          await fastify.authenticate(request, reply);
        } catch (err) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      },
      requireRole('DEVELOPER'),
    ],
  }, async (request, reply) => {
    try {
      const { feedbackId } = request.params as { feedbackId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const data = createCommentSchema.parse(request.body);

      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        return reply.status(404).send({ error: 'Feedback not found' });
      }

      const comment = await prisma.comment.create({
        data: {
          feedbackId,
          userId,
          content: data.content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log activity
      logActivity({
        feedbackId,
        userId,
        action: 'commented',
        metadata: { content: data.content.substring(0, 100) },
      });

      // Notify feedback creator (if someone else commented)
      if (feedback.createdById !== userId) {
        notificationService.create({
          userId: feedback.createdById,
          type: 'commented',
          title: `New comment on your feedback`,
          message: data.content.substring(0, 100),
          feedbackId,
        });
      }

      // Parse @mentions and notify mentioned users
      const mentions = data.content.match(/@(\w+)/g);
      if (mentions) {
        const mentionedNames = mentions.map((m: string) => m.slice(1));
        const mentionedUsers = await prisma.user.findMany({
          where: { name: { in: mentionedNames } },
          select: { id: true },
        });
        for (const mentioned of mentionedUsers) {
          if (mentioned.id !== userId) {
            notificationService.create({
              userId: mentioned.id,
              type: 'mentioned',
              title: `You were mentioned in feedback`,
              message: data.content.substring(0, 100),
              feedbackId,
            });
          }
        }
      }

      return reply.status(201).send(comment);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid comment data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to create comment' });
    }
  });

  // Get comments for feedback
  fastify.get('/:feedbackId/comments', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { feedbackId } = request.params as { feedbackId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        return reply.status(404).send({ error: 'Feedback not found' });
      }

      const comments = await prisma.comment.findMany({
        where: { feedbackId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return reply.send(comments);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch comments' });
    }
  });

  // Get activity log for feedback
  fastify.get('/:feedbackId/activity', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { feedbackId } = request.params as { feedbackId: string };

      const activities = await prisma.activityLog.findMany({
        where: { feedbackId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(activities);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch activity' });
    }
  });
}
