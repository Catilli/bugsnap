import { FastifyPluginAsync } from 'fastify';
import { UnauthorizedError } from '../utils/errors';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Create authenticate decorator
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
};