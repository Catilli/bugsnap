import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '../utils/errors';

export type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  DEVELOPER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

/**
 * Global role check preHandler factory.
 * Checks `request.user.role` (from JWT) against the hierarchy.
 * ADMIN always passes.
 *
 * Usage: `preHandler: [fastify.authenticate, requireRole('MANAGER')]`
 */
export function requireRole(minRole: UserRole) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const userRole = request.user?.role as UserRole | undefined;

    if (!userRole) {
      throw new ForbiddenError('Role information not available');
    }

    if (userRole === 'ADMIN') return;

    if ((ROLE_HIERARCHY[userRole] ?? -1) < ROLE_HIERARCHY[minRole]) {
      throw new ForbiddenError(`Requires ${minRole} role or higher`);
    }
  };
}
