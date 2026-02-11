import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { cacheInvalidate } from '../lib/redis';
import { z } from 'zod';
import { requireRole } from '../middleware/requireRole';
import { sanitizeString, sanitizeUrl } from '../utils/sanitize';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').transform(sanitizeString),
  websiteUrl: z.string().url('Must be a valid URL').transform(sanitizeUrl),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).transform(sanitizeString).optional(),
  websiteUrl: z.string().url('Must be a valid URL').transform(sanitizeUrl).optional(),
  generalAccess: z.enum(['INVITED', 'ANYONE']).optional(),
});

export async function projectRoutes(fastify: FastifyInstance) {
  // Create a new project
  fastify.post('/projects', {
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

      const { name, websiteUrl } = createProjectSchema.parse(request.body);

      const project = await prisma.project.create({
        data: {
          name,
          websiteUrl,
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

      // Invalidate project list cache for this user
      await cacheInvalidate(`user:${userId}:projects`);

      return reply.status(201).send(project);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid project data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to create project' });
    }
  });

  // Get a specific project
  fastify.get('/projects/:projectId', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          shareTokens: {
            where: { issueId: null, feedbackId: null },
            select: { token: true },
            take: 1,
          },
        },
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Check if user has access (ADMIN, owner, or member)
      const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      const isAdmin = userRecord?.role === 'ADMIN';
      const isOwner = project.createdById === userId;
      const isMember = project.members.some((member: any) => member.userId === userId);

      if (!isAdmin && !isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this project' });
      }

      return reply.send(project);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch project' });
    }
  });

  // Update a project
  fastify.patch('/projects/:projectId', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const updateData = updateProjectSchema.parse(request.body);

      // Check if user is owner or admin
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: true,
        },
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      const isGlobalAdmin = userRecord?.role === 'ADMIN';
      const isOwner = project.createdById === userId;
      const isManager = project.members.some(
        (member: any) => member.userId === userId && member.role === 'MANAGER'
      );

      if (!isGlobalAdmin && !isOwner && !isManager) {
        return reply
          .status(403)
          .send({ error: 'You need MANAGER permissions to update this project' });
      }

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
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

      // Handle share token for generalAccess toggle
      let shareToken: string | null = null;
      if (updateData.generalAccess === 'ANYONE') {
        // Reuse existing project-level token or create one
        const existing = await prisma.shareToken.findFirst({
          where: { projectId, issueId: null, feedbackId: null },
        });
        if (existing) {
          shareToken = existing.token;
        } else {
          try {
            const created = await prisma.shareToken.create({
              data: { projectId },
            });
            shareToken = created.token;
          } catch {
            // Handle race condition: another request created the token first
            const raced = await prisma.shareToken.findFirst({
              where: { projectId, issueId: null, feedbackId: null },
            });
            shareToken = raced?.token ?? null;
          }
        }
      } else if (updateData.generalAccess === 'INVITED') {
        // Delete any project-level share tokens
        await prisma.shareToken.deleteMany({
          where: { projectId, issueId: null, feedbackId: null },
        });
      }

      // Invalidate project list cache for all members
      await cacheInvalidate('user:*:projects');

      return reply.send({ ...updatedProject, shareToken });
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid project data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to update project' });
    }
  });

  // Delete a project
  fastify.delete('/projects/:projectId', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Only project owner or ADMIN can delete
      const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (userRecord?.role !== 'ADMIN' && project.createdById !== userId) {
        return reply.status(403).send({ error: 'Only the project owner can delete the project' });
      }

      await prisma.project.delete({
        where: { id: projectId },
      });

      // Invalidate project list cache for all members
      await cacheInvalidate('user:*:projects');

      return reply.send({ message: 'Project deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete project' });
    }
  });
}
