import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '../utils/errors';
import { ProjectMemberService } from '../services/projectMemberService';
import { UserRole } from './requireRole';

/**
 * Project-scoped role check preHandler factory.
 * Checks `ProjectMember.role` for the project identified by `request.params.projectId`.
 * ADMIN bypasses (handled inside ProjectMemberService.hasRole).
 *
 * Usage: `preHandler: [fastify.authenticate, requireProjectRole('MANAGER')]`
 */
export function requireProjectRole(minRole: UserRole) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const userId = request.user?.id;
    const { projectId } = request.params as { projectId?: string };

    if (!userId) {
      throw new ForbiddenError('User information not available');
    }

    if (!projectId) {
      throw new ForbiddenError('Project ID is required');
    }

    const hasPermission = await ProjectMemberService.hasRole(userId, projectId, minRole);

    if (!hasPermission) {
      throw new ForbiddenError(`Requires ${minRole} project role or higher`);
    }
  };
}
