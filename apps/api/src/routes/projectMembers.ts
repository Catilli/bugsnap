import { FastifyInstance } from 'fastify';
import { ProjectMemberService } from '../services/projectMemberService';
import { prisma } from '../lib/prisma';
import { cacheGet } from '../lib/redis';
import { z } from 'zod';
import { notificationService } from '../services/notificationService';

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER']).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER']),
});

export async function projectMemberRoutes(fastify: FastifyInstance) {
  // Get all members of a project
  fastify.get('/projects/:projectId/members', {
    preHandler: async (request, reply) => {
      await fastify.authenticate(request, reply);
    },
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Check if user has access to this project
      const hasAccess = await ProjectMemberService.isMemberOfProject(userId, projectId);
      if (!hasAccess) {
        return reply.status(403).send({ error: 'You do not have access to this project' });
      }

      const members = await ProjectMemberService.getProjectMembers(projectId);
      return reply.send(members);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch project members' });
    }
  });

  // Get mentionable users for a project (for @mention autocomplete)
  fastify.get('/projects/:projectId/mentionable', {
    preHandler: async (request, reply) => {
      await fastify.authenticate(request, reply);
    },
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const hasAccess = await ProjectMemberService.isMemberOfProject(userId, projectId);
      if (!hasAccess) {
        return reply.status(403).send({ error: 'You do not have access to this project' });
      }

      const { owner, members } = await ProjectMemberService.getProjectMembers(projectId);

      // Build flat list: owner + members, deduplicated
      const seen = new Set<string>();
      const result: { id: string; name: string; email: string }[] = [];

      if (owner) {
        seen.add(owner.id);
        result.push(owner);
      }

      for (const m of members) {
        if (!seen.has(m.user.id)) {
          seen.add(m.user.id);
          result.push(m.user);
        }
      }

      result.sort((a, b) => a.name.localeCompare(b.name));

      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch mentionable users' });
    }
  });

  // Add a member to a project
  fastify.post('/projects/:projectId/members', {
    preHandler: async (request, reply) => {
      await fastify.authenticate(request, reply);
    },
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Check if user has admin rights
      const hasAdminAccess = await ProjectMemberService.hasRole(userId, projectId, 'MANAGER');
      if (!hasAdminAccess) {
        return reply
          .status(403)
          .send({ error: 'You need MANAGER permissions to add members' });
      }

      const { email, role } = addMemberSchema.parse(request.body);

      const member = await ProjectMemberService.addMember(projectId, email, role);

      // Notify the invited user (skip if adding yourself)
      if (member.user.id !== userId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { name: true },
        });
        notificationService.create({
          userId: member.user.id,
          type: 'invited',
          title: `You were added to project "${project?.name || 'Unknown'}"`,
          message: `You were added as a member to the project "${project?.name || 'Unknown'}".`,
          projectId,
        });
      }

      return reply.status(201).send(member);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.message === 'User not found with this email') {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message === 'User is already a member of this project') {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to add project member' });
    }
  });

  // Update member role
  fastify.patch('/projects/:projectId/members/:userId', {
    preHandler: async (request, reply) => {
      await fastify.authenticate(request, reply);
    },
  }, async (request, reply) => {
    try {
      const { projectId, userId: targetUserId } = request.params as {
        projectId: string;
        userId: string;
      };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Check if user has admin rights
      const hasAdminAccess = await ProjectMemberService.hasRole(userId, projectId, 'MANAGER');
      if (!hasAdminAccess) {
        return reply
          .status(403)
          .send({ error: 'You need MANAGER permissions to update member roles' });
      }

      const { role } = updateRoleSchema.parse(request.body);

      const member = await ProjectMemberService.updateMemberRole(projectId, targetUserId, role);
      return reply.send(member);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.message === 'User is not a member of this project') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to update member role' });
    }
  });

  // Remove a member from a project
  fastify.delete('/projects/:projectId/members/:userId', {
    preHandler: async (request, reply) => {
      await fastify.authenticate(request, reply);
    },
  }, async (request, reply) => {
    try {
      const { projectId, userId: targetUserId } = request.params as {
        projectId: string;
        userId: string;
      };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Check if user has admin rights
      const hasAdminAccess = await ProjectMemberService.hasRole(userId, projectId, 'MANAGER');
      if (!hasAdminAccess) {
        return reply
          .status(403)
          .send({ error: 'You need MANAGER permissions to remove members' });
      }

      await ProjectMemberService.removeMember(projectId, targetUserId);
      return reply.send({ message: 'Member removed successfully' });
    } catch (error: any) {
      fastify.log.error(error);
      if (error.message === 'Cannot remove project owner from members') {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to remove member' });
    }
  });

  // Get user's accessible projects (owned + member)
  fastify.get('/projects', {
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

      const projectsWithCounts = await cacheGet(
        `user:${userId}:projects`,
        60, // 60 second TTL
        async () => {
          const projects = await ProjectMemberService.getUserProjects(userId);

          return Promise.all(
            projects.map(async (project: any) => {
              const issues = await prisma.issue.findMany({
                where: { projectId: project.id },
                select: { status: true },
              });

              const issueCounts = {
                open: 0,
                in_progress: 0,
                resolved: 0,
                closed: 0,
              };

              issues.forEach((issue: any) => {
                if (issue.status === 'open') issueCounts.open++;
                else if (issue.status === 'in_progress') issueCounts.in_progress++;
                else if (issue.status === 'resolved') issueCounts.resolved++;
                else if (issue.status === 'closed') issueCounts.closed++;
              });

              return {
                ...project,
                _count: {
                  tasks: issues.length,
                  ...issueCounts,
                },
              };
            })
          );
        }
      );

      return reply.send(projectsWithCounts);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch projects' });
    }
  });
}
