import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createFeedbackSchema = z.object({
  type: z.enum(['BUG', 'FEATURE']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const updateFeedbackSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z.enum(['BUG', 'FEATURE']).optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

export async function feedbackRoutes(fastify: FastifyInstance) {
  // Create new feedback
  fastify.post('/', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
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
        await request.jwtVerify();
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

      const { type, status, priority, search } = request.query as {
        type?: string;
        status?: string;
        priority?: string;
        search?: string;
      };

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
        await request.jwtVerify();
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
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
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
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
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

      // Only the creator can delete feedback
      if (feedback.createdById !== userId) {
        return reply.status(403).send({ error: 'Only the feedback creator can delete this feedback' });
      }

      await prisma.feedback.delete({
        where: { id: feedbackId },
      });

      return reply.send({ message: 'Feedback deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete feedback' });
    }
  });

  // Add comment to feedback
  fastify.post('/:feedbackId/comments', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
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
        await request.jwtVerify();
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
}
