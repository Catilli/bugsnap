import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  websiteUrl: z.string().url('Must be a valid URL'),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  websiteUrl: z.string().url('Must be a valid URL').optional(),
});

export async function projectRoutes(fastify: FastifyInstance) {
  // Create a new project
  fastify.post('/projects', {
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
        await request.jwtVerify();
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
          // _count: {
          //   select: {
          //     bugReports: true,
          //   },
          // },
        },
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Check if user has access (is owner or member)
      const isOwner = project.createdById === userId;
      const isMember = project.members.some((member: any) => member.userId === userId);

      if (!isOwner && !isMember) {
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
        await request.jwtVerify();
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

      const isOwner = project.createdById === userId;
      const isAdmin = project.members.some(
        (member: any) => member.userId === userId && (member.role === 'admin' || member.role === 'owner')
      );

      if (!isOwner && !isAdmin) {
        return reply
          .status(403)
          .send({ error: 'You need admin permissions to update this project' });
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

      return reply.send(updatedProject);
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
        await request.jwtVerify();
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

      // Only project owner can delete
      if (project.createdById !== userId) {
        return reply.status(403).send({ error: 'Only the project owner can delete the project' });
      }

      await prisma.project.delete({
        where: { id: projectId },
      });

      return reply.send({ message: 'Project deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete project' });
    }
  });
}