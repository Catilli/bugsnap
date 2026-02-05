import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '@clerk/backend';
import { prisma } from '../lib/prisma';
import { UnauthorizedError } from '../utils/errors';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}

// Simple in-memory cache: clerkId → { user, expiresAt }
const userCache = new Map<string, { user: { id: string; email: string; role: string }; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

async function syncClerkUserToDatabase(clerkId: string, email: string, name: string) {
  // Check cache first
  const cached = userCache.get(clerkId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  // 1. Find by clerkId
  let user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    // 2. Find by email (account linking for existing users)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Link Clerk ID to existing account
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { clerkId },
        select: { id: true, email: true, role: true },
      });
    } else {
      // 3. Create new user
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name: name || email,
        },
        select: { id: true, email: true, role: true },
      });
    }
  }

  // Cache the result
  userCache.set(clerkId, { user, expiresAt: Date.now() + CACHE_TTL_MS });

  return user;
}

export async function verifyClerkToken(token: string) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is not configured');
  }

  const payload = await verifyToken(token, { secretKey });

  const clerkId = payload.sub;
  const email = (payload as any).email
    || (payload as any).primary_email_address
    || '';
  const name = (payload as any).name
    || (payload as any).first_name
    || '';

  return { clerkId, email, name };
}

export const clerkAuthPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async function (request: FastifyRequest, _reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);

    try {
      const { clerkId, email, name } = await verifyClerkToken(token);
      const user = await syncClerkUserToDatabase(clerkId, email, name);
      request.user = user;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
};
