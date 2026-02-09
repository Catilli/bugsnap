import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function shareRoutes(fastify: FastifyInstance) {
  // Create a share token for an issue (MANAGER+)
  fastify.post('/issues/:issueId/share', {
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

      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: { project: { include: { members: true } } },
      });

      if (!issue) return reply.status(404).send({ error: 'Issue not found' });

      // Check MANAGER+ access
      const isAdmin = userRole === 'ADMIN';
      const isOwner = issue.project.createdById === userId;
      const membership = issue.project.members.find((m: any) => m.userId === userId);
      const effectiveRole = isAdmin ? 'ADMIN' : isOwner ? 'MANAGER' : (membership?.role ?? 'VIEWER');
      const roleLevel: Record<string, number> = { VIEWER: 0, DEVELOPER: 1, MANAGER: 2, ADMIN: 3 };

      if (roleLevel[effectiveRole] < roleLevel['MANAGER']) {
        return reply.status(403).send({ error: 'Only MANAGER or higher can share issues' });
      }

      // Parse optional expiry from body
      const body = request.body as { expiresInDays?: number } | undefined;
      const expiresAt = body?.expiresInDays
        ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      const shareToken = await prisma.shareToken.create({
        data: {
          issueId,
          projectId: issue.projectId,
          expiresAt,
        },
      });

      return reply.status(201).send({
        token: shareToken.token,
        expiresAt: shareToken.expiresAt,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create share link' });
    }
  });

  // Create a share token for feedback (DEVELOPER+)
  fastify.post('/feedback/:feedbackId/share', {
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
      const userRole = (request.user as any)?.role;

      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      if (userRole === 'VIEWER') {
        return reply.status(403).send({ error: 'Viewers cannot share feedback' });
      }

      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) return reply.status(404).send({ error: 'Feedback not found' });

      const body = request.body as { expiresInDays?: number } | undefined;
      const expiresAt = body?.expiresInDays
        ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      const shareToken = await prisma.shareToken.create({
        data: {
          feedbackId,
          expiresAt,
        },
      });

      return reply.status(201).send({
        token: shareToken.token,
        expiresAt: shareToken.expiresAt,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create share link' });
    }
  });

  // Access shared content (no auth required) — supports both issues and feedback
  fastify.get('/share/:token', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const shareToken = await prisma.shareToken.findUnique({
        where: { token },
        include: {
          issue: {
            include: {
              createdBy: { select: { id: true, name: true, email: true } },
              assignedTo: { select: { id: true, name: true, email: true } },
              comments: {
                include: { user: { select: { id: true, name: true, email: true } } },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
          feedback: {
            include: {
              createdBy: { select: { id: true, name: true, email: true } },
              comments: {
                include: { user: { select: { id: true, name: true, email: true } } },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      if (!shareToken) {
        return reply.status(404).send({ error: 'Share link not found' });
      }

      // Check expiry
      if (shareToken.expiresAt && shareToken.expiresAt < new Date()) {
        return reply.status(410).send({ error: 'Share link has expired' });
      }

      if (shareToken.issue) {
        return reply.send({ type: 'issue', data: shareToken.issue });
      }

      if (shareToken.feedback) {
        return reply.send({ type: 'feedback', data: shareToken.feedback });
      }

      return reply.status(404).send({ error: 'Shared content not found' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch shared content' });
    }
  });
}
