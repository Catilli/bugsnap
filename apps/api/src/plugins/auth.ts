import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
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

const authPluginFn: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async function (request: FastifyRequest, _reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
};

export const authPlugin = fp(authPluginFn, { name: 'auth-plugin' });
