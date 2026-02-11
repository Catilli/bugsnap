import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { zSanitizedString } from '../utils/sanitize';

const roleEnum = z.enum(['ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER']);

const usersQuerySchema = z.object({
  search: z.string().max(200).optional(),
  role: roleEnum.optional(),
});

const updateRoleSchema = z.object({
  role: roleEnum,
});

const createUserSchema = z.object({
  email: z.string().email(),
  name: zSanitizedString().pipe(z.string().min(1).max(100)),
  password: z.string().min(8).max(128).optional(),
  role: roleEnum.optional().default('DEVELOPER'),
});

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users/mentionable — lightweight list for @mention autocomplete (any auth'd user)
  fastify.get('/users/mentionable', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (_request, reply) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });

    return reply.send(users);
  });

  // POST /api/users — create a new user (ADMIN only)
  fastify.post('/users', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    const currentUserId = (request.user as any)?.id;
    if (!currentUserId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only admins can add users' });
    }

    const { email, name, password, role } = createUserSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'A user with this email already exists' });
    }

    const rawPassword = password || crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const created = await prisma.user.create({
      data: { email, name, role, password: hashedPassword },
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
    });

    return reply.status(201).send(created);
  });

  // GET /api/users — list all users (MANAGER+ only)
  fastify.get('/users', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
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
  fastify.patch('/users/:userId/role', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
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
