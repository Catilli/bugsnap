import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { requireRole } from '../middleware/requireRole';
import { sanitizeString } from '../utils/sanitize';
import { logActivity } from '../utils/activityLogger';
import { emitQACycleEvent } from '../lib/eventBus';

const createCycleSchema = z.object({
  title: z.string().min(1, 'Title is required').transform(sanitizeString),
  description: z.string().transform(sanitizeString).optional(),
});

const updateCycleSchema = z.object({
  title: z.string().min(1).transform(sanitizeString).optional(),
  description: z.string().transform(sanitizeString).optional(),
  status: z.enum(['open', 'in_progress', 'completed']).optional(),
});

const addIssuesSchema = z.object({
  issueIds: z.array(z.string().uuid()).min(1, 'At least one issue ID is required'),
});

const cycleQuerySchema = z.object({
  status: z.string().max(50).optional(),
});

/** Verify user has access to a project. Returns project or throws reply. */
async function verifyProjectAccess(
  projectId: string,
  userId: string,
  reply: any,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    reply.status(404).send({ error: 'Project not found' });
    return null;
  }

  const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isAdmin = userRecord?.role === 'ADMIN';
  const isOwner = project.createdById === userId;
  const isMember = project.members.some((m: any) => m.userId === userId);

  if (!isAdmin && !isOwner && !isMember) {
    reply.status(403).send({ error: 'Access denied' });
    return null;
  }

  return project;
}

export async function qaCycleRoutes(fastify: FastifyInstance) {
  // List QA cycles for a project
  fastify.get('/projects/:projectId/qa-cycles', {
    preHandler: [
      async (request, reply) => {
        try { await fastify.authenticate(request, reply); } catch { return reply.status(401).send({ error: 'Unauthorized' }); }
      },
      requireRole('DEVELOPER'),
    ],
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const project = await verifyProjectAccess(projectId, userId, reply);
      if (!project) return;

      const { status } = cycleQuerySchema.parse(request.query);

      const whereClause: any = { projectId };
      if (status) {
        const statuses = status.split(',').filter(Boolean);
        if (statuses.length > 0) whereClause.status = { in: statuses };
      }

      const cycles = await prisma.qACycle.findMany({
        where: whereClause,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { issues: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(cycles);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch QA cycles' });
    }
  });

  // Create a new QA cycle
  fastify.post('/projects/:projectId/qa-cycles', {
    preHandler: [
      async (request, reply) => {
        try { await fastify.authenticate(request, reply); } catch { return reply.status(401).send({ error: 'Unauthorized' }); }
      },
      requireRole('MANAGER'),
    ],
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const project = await verifyProjectAccess(projectId, userId, reply);
      if (!project) return;

      const data = createCycleSchema.parse(request.body);

      const cycle = await prisma.qACycle.create({
        data: {
          projectId,
          title: data.title,
          description: data.description,
          createdById: userId,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { issues: true } },
        },
      });

      logActivity({
        projectId,
        userId,
        action: 'created',
        metadata: { type: 'qa_cycle', title: cycle.title },
      });

      emitQACycleEvent({ type: 'qacycle:created', projectId, data: cycle as any });

      return reply.status(201).send(cycle);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid cycle data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to create QA cycle' });
    }
  });

  // Get a specific QA cycle with its issues
  fastify.get('/qa-cycles/:cycleId', {
    preHandler: [
      async (request, reply) => {
        try { await fastify.authenticate(request, reply); } catch { return reply.status(401).send({ error: 'Unauthorized' }); }
      },
      requireRole('DEVELOPER'),
    ],
  }, async (request, reply) => {
    try {
      const { cycleId } = request.params as { cycleId: string };
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const cycle = await prisma.qACycle.findUnique({
        where: { id: cycleId },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          issues: {
            include: {
              issue: {
                include: {
                  createdBy: { select: { id: true, name: true, email: true } },
                  assignedTo: { select: { id: true, name: true, email: true } },
                  _count: { select: { comments: true } },
                },
              },
            },
            orderBy: { addedAt: 'desc' },
          },
        },
      });

      if (!cycle) {
        return reply.status(404).send({ error: 'QA cycle not found' });
      }

      // Verify project access
      const project = await verifyProjectAccess(cycle.projectId, userId, reply);
      if (!project) return;

      return reply.send(cycle);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch QA cycle' });
    }
  });

  // Update a QA cycle
  fastify.patch('/qa-cycles/:cycleId', {
    preHandler: [
      async (request, reply) => {
        try { await fastify.authenticate(request, reply); } catch { return reply.status(401).send({ error: 'Unauthorized' }); }
      },
      requireRole('MANAGER'),
    ],
  }, async (request, reply) => {
    try {
      const { cycleId } = request.params as { cycleId: string };
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const cycle = await prisma.qACycle.findUnique({ where: { id: cycleId } });
      if (!cycle) {
        return reply.status(404).send({ error: 'QA cycle not found' });
      }

      const project = await verifyProjectAccess(cycle.projectId, userId, reply);
      if (!project) return;

      const updateData = updateCycleSchema.parse(request.body);

      const updatedCycle = await prisma.qACycle.update({
        where: { id: cycleId },
        data: updateData,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { issues: true } },
        },
      });

      // Log activity for changed fields
      for (const [field, newValue] of Object.entries(updateData)) {
        const oldValue = (cycle as any)[field];
        if (oldValue !== newValue) {
          logActivity({
            projectId: cycle.projectId,
            userId,
            action: field === 'status' ? 'status_changed' : 'updated',
            field,
            oldValue: oldValue != null ? String(oldValue) : undefined,
            newValue: newValue != null ? String(newValue) : undefined,
            metadata: { type: 'qa_cycle', cycleId },
          });
        }
      }

      emitQACycleEvent({ type: 'qacycle:updated', projectId: cycle.projectId, data: updatedCycle as any });

      return reply.send(updatedCycle);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid cycle data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to update QA cycle' });
    }
  });

  // Delete a QA cycle
  fastify.delete('/qa-cycles/:cycleId', {
    preHandler: [
      async (request, reply) => {
        try { await fastify.authenticate(request, reply); } catch { return reply.status(401).send({ error: 'Unauthorized' }); }
      },
      requireRole('MANAGER'),
    ],
  }, async (request, reply) => {
    try {
      const { cycleId } = request.params as { cycleId: string };
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const cycle = await prisma.qACycle.findUnique({ where: { id: cycleId } });
      if (!cycle) {
        return reply.status(404).send({ error: 'QA cycle not found' });
      }

      const project = await verifyProjectAccess(cycle.projectId, userId, reply);
      if (!project) return;

      await prisma.qACycle.delete({ where: { id: cycleId } });

      logActivity({
        projectId: cycle.projectId,
        userId,
        action: 'deleted',
        metadata: { type: 'qa_cycle', title: cycle.title },
      });

      emitQACycleEvent({ type: 'qacycle:deleted', projectId: cycle.projectId, data: { id: cycleId } });

      return reply.send({ message: 'QA cycle deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete QA cycle' });
    }
  });

  // Add issues to a QA cycle
  fastify.post('/qa-cycles/:cycleId/issues', {
    preHandler: [
      async (request, reply) => {
        try { await fastify.authenticate(request, reply); } catch { return reply.status(401).send({ error: 'Unauthorized' }); }
      },
      requireRole('MANAGER'),
    ],
  }, async (request, reply) => {
    try {
      const { cycleId } = request.params as { cycleId: string };
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const cycle = await prisma.qACycle.findUnique({ where: { id: cycleId } });
      if (!cycle) {
        return reply.status(404).send({ error: 'QA cycle not found' });
      }

      const project = await verifyProjectAccess(cycle.projectId, userId, reply);
      if (!project) return;

      const { issueIds } = addIssuesSchema.parse(request.body);

      // Verify all issues belong to the same project
      const issues = await prisma.issue.findMany({
        where: { id: { in: issueIds }, projectId: cycle.projectId },
        select: { id: true },
      });

      if (issues.length !== issueIds.length) {
        return reply.status(400).send({ error: 'Some issues were not found or do not belong to this project' });
      }

      // Create links (skip duplicates via skipDuplicates)
      await prisma.qACycleIssue.createMany({
        data: issueIds.map((issueId) => ({
          qaCycleId: cycleId,
          issueId,
        })),
        skipDuplicates: true,
      });

      logActivity({
        projectId: cycle.projectId,
        userId,
        action: 'updated',
        metadata: { type: 'qa_cycle', cycleId, action: 'issues_added', count: issueIds.length },
      });

      emitQACycleEvent({
        type: 'qacycle:issue_added',
        projectId: cycle.projectId,
        data: { cycleId, issueIds },
      });

      return reply.send({ message: `${issueIds.length} issue(s) added to cycle` });
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to add issues to cycle' });
    }
  });

  // Remove an issue from a QA cycle
  fastify.delete('/qa-cycles/:cycleId/issues/:issueId', {
    preHandler: [
      async (request, reply) => {
        try { await fastify.authenticate(request, reply); } catch { return reply.status(401).send({ error: 'Unauthorized' }); }
      },
      requireRole('MANAGER'),
    ],
  }, async (request, reply) => {
    try {
      const { cycleId, issueId } = request.params as { cycleId: string; issueId: string };
      const userId = (request.user as any)?.id;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

      const cycle = await prisma.qACycle.findUnique({ where: { id: cycleId } });
      if (!cycle) {
        return reply.status(404).send({ error: 'QA cycle not found' });
      }

      const project = await verifyProjectAccess(cycle.projectId, userId, reply);
      if (!project) return;

      const link = await prisma.qACycleIssue.findUnique({
        where: { qaCycleId_issueId: { qaCycleId: cycleId, issueId } },
      });

      if (!link) {
        return reply.status(404).send({ error: 'Issue not in this cycle' });
      }

      await prisma.qACycleIssue.delete({
        where: { id: link.id },
      });

      logActivity({
        projectId: cycle.projectId,
        userId,
        action: 'updated',
        metadata: { type: 'qa_cycle', cycleId, action: 'issue_removed', issueId },
      });

      emitQACycleEvent({
        type: 'qacycle:issue_removed',
        projectId: cycle.projectId,
        data: { cycleId, issueId },
      });

      return reply.send({ message: 'Issue removed from cycle' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to remove issue from cycle' });
    }
  });
}
