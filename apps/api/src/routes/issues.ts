import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { emitIssueEvent } from '../lib/eventBus';
import { cacheInvalidate } from '../lib/redis';

const createIssueSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, 'Issue title is required'),
  description: z.string().optional(),
  url: z.string().optional(),
  screenshotUrl: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z.enum(['BUG', 'FEATURE', 'TASK']).default('TASK'),
  visibility: z.enum(['members', 'members_and_clients']).default('members'),
  assignedToId: z.string().uuid().optional(),
  environmentData: z.any().optional(),
  annotations: z.array(z.object({
    type: z.enum(['pen', 'rectangle', 'arrow', 'text']),
    coordinates: z.any(),
    content: z.string().optional(),
    color: z.string().optional(),
  })).optional(),
});

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z.enum(['BUG', 'FEATURE', 'TASK']).optional(),
  visibility: z.enum(['members', 'members_and_clients']).optional(),
  assignedToId: z.string().uuid().optional(),
});

export async function issueRoutes(fastify: FastifyInstance) {
  // Get next issue number for a project
  fastify.get('/projects/:projectId/next-issue-number', {
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

      // Verify user has access to project
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
      const isMember = project.members.some((member: any) => member.userId === userId);

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this project' });
      }

      // Get the type from query params (default to TASK)
      const { type } = request.query as { type?: string };
      const issueType = type || 'TASK';

      // Get the last issue of this type to determine next number
      const lastIssue = await prisma.issue.findFirst({
        where: {
          projectId,
          type: issueType as any,
        },
        orderBy: { createdAt: 'desc' },
      });

      let nextIssueNumber = 1;
      if (lastIssue) {
        // Extract number from "Type #X ..." format (Bug #X, Feature #X, Task #X)
        const match = lastIssue.title.match(/(Bug|Feature|Task) #(\d+)/);
        if (match) {
          nextIssueNumber = parseInt(match[2]) + 1;
        }
      }

      return reply.send({ nextIssueNumber });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get next issue number' });
    }
  });

  // Create a new issue
  fastify.post('/issues', {
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

      const data = createIssueSchema.parse(request.body);

      // Verify user has access to project
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        include: {
          members: true,
        },
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const isOwner = project.createdById === userId;
      const isMember = project.members.some((member: any) => member.userId === userId);

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this project' });
      }

      // Get next issue number for this project and type
      const issueType = data.type || 'TASK';
      const lastIssue = await prisma.issue.findFirst({
        where: {
          projectId: data.projectId,
          type: issueType,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get type prefix for title
      const typePrefix = { BUG: 'Bug', FEATURE: 'Feature', TASK: 'Task' }[issueType];

      let newIssueNumber = 1;
      if (lastIssue) {
        // Extract number from "Type #X ..." format (Bug #X, Feature #X, Task #X)
        const match = lastIssue.title.match(/(Bug|Feature|Task) #(\d+)/);
        if (match) {
          newIssueNumber = parseInt(match[2]) + 1;
        }
      }

      // Create issue with type-aware title prefix
      const issue = await prisma.issue.create({
        data: {
          projectId: data.projectId,
          title: `${typePrefix} #${newIssueNumber} - ${data.title}`,
          type: issueType,
          description: data.description,
          url: data.url,
          screenshotUrl: data.screenshotUrl,
          priority: data.priority,
          visibility: data.visibility,
          assignedToId: data.assignedToId,
          environmentData: data.environmentData,
          createdById: userId,
          // Create annotations if provided
          annotations: data.annotations ? {
            create: data.annotations.map((annotation: any) => ({
              type: annotation.type,
              coordinates: annotation.coordinates,
              content: annotation.content,
              color: annotation.color || '#ef4444', // Default red color
            }))
          } : undefined,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          annotations: true,
        },
      });

      emitIssueEvent({ type: 'issue:created', projectId: data.projectId, data: issue as any });
      await cacheInvalidate('user:*:projects');
      return reply.status(201).send(issue);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid issue data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to create issue' });
    }
  });

  // Get issues for a project
  fastify.get('/projects/:projectId/issues', {
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

      // Verify user has access to project
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
      const isMember = project.members.some((member: any) => member.userId === userId);

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this project' });
      }

      // Parse query params for filtering
      const { type, status, priority, search } = request.query as {
        type?: string;
        status?: string;
        priority?: string;
        search?: string;
      };

      // Build where clause with filters
      const whereClause: any = { projectId };

      // Filter by type (comma-separated, e.g., "BUG,FEATURE")
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

      // Get issues
      const issues = await prisma.issue.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
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
        orderBy: [
          {
            title: 'asc',
          },
        ],
      });

      return reply.send(issues);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch issues' });
    }
  });

  // Get a specific issue
  fastify.get('/issues/:issueId', {
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
        include: {
          project: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
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

      if (!issue) {
        return reply.status(404).send({ error: 'Issue not found' });
      }

      // Verify user has access to project
      const isOwner = issue.project.createdById === userId;
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: issue.projectId,
          userId,
        },
      });

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this issue' });
      }

      return reply.send(issue);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch issue' });
    }
  });

  // Update an issue
  fastify.patch('/issues/:issueId', {
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

      const updateData = updateIssueSchema.parse(request.body);

      // Get issue to verify access
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: { project: true },
      });

      if (!issue) {
        return reply.status(404).send({ error: 'Issue not found' });
      }

      // Verify user has access
      const isOwner = issue.project.createdById === userId;
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: issue.projectId,
          userId,
        },
      });

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this issue' });
      }

      // Update issue
      const updatedIssue = await prisma.issue.update({
        where: { id: issueId },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      emitIssueEvent({ type: 'issue:updated', projectId: issue.projectId, data: updatedIssue as any });
      await cacheInvalidate('user:*:projects');
      return reply.send(updatedIssue);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid issue data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to update issue' });
    }
  });

  // Delete an issue
  fastify.delete('/issues/:issueId', {
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

      // Only owner or issue creator can delete
      const isProjectOwner = issue.project.createdById === userId;
      const isIssueCreator = issue.createdById === userId;

      if (!isProjectOwner && !isIssueCreator) {
        return reply.status(403).send({ error: 'Only the project owner or issue creator can delete this issue' });
      }

      await prisma.issue.delete({
        where: { id: issueId },
      });

      emitIssueEvent({ type: 'issue:deleted', projectId: issue.projectId, data: { id: issueId } });
      await cacheInvalidate('user:*:projects');
      return reply.send({ message: 'Issue deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete issue' });
    }
  });
}
