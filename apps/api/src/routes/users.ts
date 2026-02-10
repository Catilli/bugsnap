import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const roleEnum = z.enum(['ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER']);

const usersQuerySchema = z.object({
  search: z.string().max(200).optional(),
  role: roleEnum.optional(),
});

const updateRoleSchema = z.object({
  role: roleEnum,
});

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users — list all users (MANAGER+ only)
  fastify.get('/users', async (request, reply) => {
    const userId = (request.user as any)?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Only MANAGER+ can view all users
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }

    const { search, role } = usersQuerySchema.parse(request.query);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        oauthProvider: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            assignedIssues: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    return reply.send(users);
  });

  // PATCH /api/users/:userId/role — update user role (ADMIN only)
  fastify.patch('/users/:userId/role', async (request, reply) => {
    const currentUserId = (request.user as any)?.id;
    if (!currentUserId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only admins can change user roles' });
    }

    const { userId } = request.params as { userId: string };
    const { role } = updateRoleSchema.parse(request.body);

    // Prevent self-demotion
    if (userId === currentUserId) {
      return reply.status(400).send({ error: 'Cannot change your own role' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return reply.send(updated);
  });
}
