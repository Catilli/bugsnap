import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { emitIssueEvent } from '../lib/eventBus';
import { z } from 'zod';
import { sanitizeString } from '../utils/sanitize';
import { logActivity } from '../utils/activityLogger';
import { notificationService } from '../services/notificationService';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').transform(sanitizeString),
  mentionedUserIds: z.array(z.string().uuid()).optional().default([]),
});

/** Batch-fetch mentioned users and attach to each comment */
async function attachMentionedUsers(comments: any[]) {
  const allIds = new Set<string>();
  for (const c of comments) {
    for (const id of c.mentionedUserIds || []) {
      allIds.add(id);
    }
  }

  if (allIds.size === 0) return comments;

  const users = await prisma.user.findMany({
    where: { id: { in: [...allIds] } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  return comments.map(c => ({
    ...c,
    mentionedUsers: (c.mentionedUserIds || [])
      .map((id: string) => userMap.get(id))
      .filter(Boolean),
  }));
}

/** Validate mentionedUserIds against project members + owner */
async function validateMentionIds(
  mentionedUserIds: string[],
  projectId: string,
): Promise<string[]> {
  if (mentionedUserIds.length === 0) return [];

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });

  const validIds = new Set<string>();
  if (project) validIds.add(project.createdById);
  for (const m of members) validIds.add(m.userId);

  return mentionedUserIds.filter(id => validIds.has(id));
}

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

      // Validate mentionedUserIds against project membership
      const validatedMentionIds = await validateMentionIds(data.mentionedUserIds, issue.projectId);

      const comment = await prisma.comment.create({
        data: {
          issueId,
          userId,
          content: data.content,
          mentionedUserIds: validatedMentionIds,
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

      // Attach mentionedUsers for the response
      const [enriched] = await attachMentionedUsers([comment]);

      // Emit SSE event so other clients see the new comment
      emitIssueEvent({ type: 'issue:updated', projectId: issue.projectId, data: issue as any });

      // Log activity
      logActivity({
        projectId: issue.projectId,
        issueId,
        userId,
        action: 'commented',
        metadata: { snippet: data.content.substring(0, 100) },
      });

      // Notify issue creator + assignee (exclude comment author)
      const notifyIds = new Set<string>();
      if (issue.createdById) notifyIds.add(issue.createdById);
      if ((issue as any).assignedToId) notifyIds.add((issue as any).assignedToId);
      notifyIds.delete(userId);

      for (const recipientId of notifyIds) {
        notificationService.create({
          userId: recipientId,
          type: 'commented',
          title: `New comment on "${issue.title}"`,
          message: data.content.substring(0, 200),
          issueId,
          projectId: issue.projectId,
        });
      }

      // Notify mentioned users (from validated IDs if provided, else regex fallback)
      const mentionIdsToNotify = validatedMentionIds.length > 0
        ? validatedMentionIds
        : await (async () => {
            // Regex fallback for clients that don't send mentionedUserIds (e.g. extension)
            const mentions = data.content.match(/@(\w+)/g);
            if (!mentions) return [];
            const mentionNames = mentions.map(m => m.slice(1));
            const users = await prisma.user.findMany({
              where: { name: { in: mentionNames, mode: 'insensitive' } },
              select: { id: true },
            });
            return users.map(u => u.id);
          })();

      for (const mentionedId of mentionIdsToNotify) {
        if (mentionedId !== userId && !notifyIds.has(mentionedId)) {
          notificationService.create({
            userId: mentionedId,
            type: 'mentioned',
            title: `You were mentioned in "${issue.title}"`,
            message: data.content.substring(0, 200),
            issueId,
            projectId: issue.projectId,
          });
        }
      }

      return reply.status(201).send(enriched);
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

      const enriched = await attachMentionedUsers(comments);

      return reply.send(enriched);
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
        include: {
          issue: { select: { projectId: true, title: true } },
        },
      });

      if (!comment) {
        return reply.status(404).send({ error: 'Comment not found' });
      }

      if (comment.userId !== userId) {
        return reply.status(403).send({ error: 'Only the comment author can update this comment' });
      }

      // Validate mentionedUserIds if the comment is on an issue
      let validatedMentionIds: string[] = [];
      if (comment.issue && data.mentionedUserIds.length > 0) {
        validatedMentionIds = await validateMentionIds(data.mentionedUserIds, comment.issue.projectId);
      }

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: data.content,
          mentionedUserIds: validatedMentionIds,
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

      // Notify newly mentioned users (diff old vs new)
      if (comment.issue) {
        const oldIds = new Set(comment.mentionedUserIds || []);
        const newMentionIds = validatedMentionIds.filter(id => !oldIds.has(id));

        for (const mentionedId of newMentionIds) {
          if (mentionedId !== userId) {
            notificationService.create({
              userId: mentionedId,
              type: 'mentioned',
              title: `You were mentioned in "${comment.issue.title}"`,
              message: data.content.substring(0, 200),
              issueId: comment.issueId!,
              projectId: comment.issue.projectId,
            });
          }
        }
      }

      const [enriched] = await attachMentionedUsers([updatedComment]);

      return reply.send(enriched);
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
