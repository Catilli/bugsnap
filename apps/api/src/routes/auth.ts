import { FastifyPluginAsync } from 'fastify';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from '@bugsnap/shared';
import { authService } from '../services/authService';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/auth/register
  fastify.post(
    '/register',
    async (request, reply) => {
      // Validate request body
      const validated = registerSchema.parse(request.body);
      const { email, password, name } = validated;

      const user = await authService.register(email, password, name);
      const token = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        { expiresIn: '7d' }
      );

      return reply.status(201).send({
        user,
        token,
      });
    }
  );

  // POST /api/auth/login
  fastify.post(
    '/login',
    async (request, reply) => {
      // Validate request body
      const validated = loginSchema.parse(request.body);
      const { email, password } = validated;

      const user = await authService.login(email, password);
      const token = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        { expiresIn: '7d' }
      );

      return reply.status(200).send({
        user,
        token,
      });
    }
  );

  // POST /api/auth/logout
  fastify.post('/logout', async (request, reply) => {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // For additional security, you could implement a token blacklist here
    return reply.status(200).send({
      message: 'Logged out successfully',
    });
  });

  // GET /api/auth/me
  fastify.get('/me', async (request, reply) => {
    try {
      await request.jwtVerify();
      const userId = request.user.id;
      const user = await authService.getUserById(userId);

      return reply.status(200).send(user);
    } catch (error) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
    }
  });
};