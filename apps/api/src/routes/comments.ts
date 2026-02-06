import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { emitIssueEvent } from '../lib/eventBus';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

export async function commentRoutes(fastify: FastifyInstance) {
  // Create a comment on an issue
  fastify.post('/issues/:issueId/comments', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { issueId } = request.params as { issueId: string };
      const userId = (request.user as any)?.id;
      const userRole = (request.user as any)?.role;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // VIEWER cannot comment
      if (userRole === 'VIEWER') {
        return reply.status(403).send({ error: 'Viewers cannot add comments' });
      }

      const data = createCommentSchema.parse(request.body);

      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: { project: true },
      });

      if (!issue) {
        return reply.status(404).send({ error: 'Issue not found' });
      }

      // Verify user has access to project (ADMIN bypasses)
      const isAdmin = userRole === 'ADMIN';
      const isOwner = issue.project.createdById === userId;
      const isMember = await prisma.projectMember.findFirst({
        where: { projectId: issue.projectId, userId },
      });

      if (!isAdmin && !isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this issue' });
      }

      const comment = await prisma.comment.create({
        data: {
          issueId,
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
      emitIssueEvent({ type: 'issue:updated', projectId: issue.projectId, data: issue as any });

      return reply.status(201).send(comment);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid comment data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to create comment' });
    }
  });

  // List comments for an issue
  fastify.get('/issues/:issueId/comments', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { issueId } = request.params as { issueId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: { project: true },
      });

      if (!issue) {
        return reply.status(404).send({ error: 'Issue not found' });
      }

      // Verify user has access to project
      const isOwner = issue.project.createdById === userId;
      const isMember = await prisma.projectMember.findFirst({
        where: { projectId: issue.projectId, userId },
      });

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this issue' });
      }

      const comments = await prisma.comment.findMany({
        where: { issueId },
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
        await fastify.authenticate(request, reply);
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
        await fastify.authenticate(request, reply);
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
          issue: {
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

      if (comment.issue) {
        isOwner = comment.issue.project.createdById === userId;
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
