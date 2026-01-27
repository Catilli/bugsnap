import { FastifyInstance } from 'fastify';
import { ProjectMemberService } from '../services/projectMemberService';
import { z } from 'zod';

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

export async function projectMemberRoutes(fastify: FastifyInstance) {
  // Get all members of a project
  fastify.get('/projects/:projectId/members', async (request, reply) => {
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

  // Add a member to a project
  fastify.post('/projects/:projectId/members', async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Check if user has admin rights
      const hasAdminAccess = await ProjectMemberService.hasRole(userId, projectId, 'admin');
      if (!hasAdminAccess) {
        return reply
          .status(403)
          .send({ error: 'You need admin permissions to add members' });
      }

      const { email, role } = addMemberSchema.parse(request.body);

      const member = await ProjectMemberService.addMember(projectId, email, role);
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
  fastify.patch('/projects/:projectId/members/:userId', async (request, reply) => {
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
      const hasAdminAccess = await ProjectMemberService.hasRole(userId, projectId, 'admin');
      if (!hasAdminAccess) {
        return reply
          .status(403)
          .send({ error: 'You need admin permissions to update member roles' });
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
  fastify.delete('/projects/:projectId/members/:userId', async (request, reply) => {
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
      const hasAdminAccess = await ProjectMemberService.hasRole(userId, projectId, 'admin');
      if (!hasAdminAccess) {
        return reply
          .status(403)
          .send({ error: 'You need admin permissions to remove members' });
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

      const projects = await ProjectMemberService.getUserProjects(userId);
      return reply.send(projects);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch projects' });
    }
  });
}