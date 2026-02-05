import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { emitTaskEvent } from '../lib/eventBus';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

export async function commentRoutes(fastify: FastifyInstance) {
  // Create a comment on a task
  fastify.post('/tasks/:taskId/comments', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const data = createCommentSchema.parse(request.body);

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      // Verify user has access to project
      const isOwner = task.project.createdById === userId;
      const isMember = await prisma.projectMember.findFirst({
        where: { projectId: task.projectId, userId },
      });

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this task' });
      }

      const comment = await prisma.comment.create({
        data: {
          taskId,
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

      // Emit SSE event so other clients see the new comment
      emitTaskEvent({ type: 'task:updated', projectId: task.projectId, data: task as any });

      return reply.status(201).send(comment);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid comment data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to create comment' });
    }
  });

  // List comments for a task
  fastify.get('/tasks/:taskId/comments', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      // Verify user has access to project
      const isOwner = task.project.createdById === userId;
      const isMember = await prisma.projectMember.findFirst({
        where: { projectId: task.projectId, userId },
      });

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this task' });
      }

      const comments = await prisma.comment.findMany({
        where: { taskId },
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

  // Update a comment (author only)
  fastify.patch('/comments/:commentId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { commentId } = request.params as { commentId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const data = createCommentSchema.parse(request.body);

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        return reply.status(404).send({ error: 'Comment not found' });
      }

      if (comment.userId !== userId) {
        return reply.status(403).send({ error: 'Only the comment author can update this comment' });
      }

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { content: data.content },
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

      return reply.send(updatedComment);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid comment data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to update comment' });
    }
  });

  // Delete a comment (author or project owner)
  fastify.delete('/comments/:commentId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { commentId } = request.params as { commentId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          task: {
            include: { project: true },
          },
          feedback: true,
        },
      });

      if (!comment) {
        return reply.status(404).send({ error: 'Comment not found' });
      }

      const isAuthor = comment.userId === userId;
      let isOwner = false;

      if (comment.task) {
        isOwner = comment.task.project.createdById === userId;
      } else if (comment.feedback) {
        isOwner = comment.feedback.createdById === userId;
      }

      if (!isAuthor && !isOwner) {
        return reply.status(403).send({ error: 'Only the comment author or project/feedback owner can delete this comment' });
      }

      await prisma.comment.delete({ where: { id: commentId } });

      return reply.send({ message: 'Comment deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete comment' });
    }
  });
}
