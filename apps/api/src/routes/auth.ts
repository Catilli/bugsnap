import { FastifyPluginAsync } from 'fastify';
import { authService } from '../services/authService';
import { z } from 'zod';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/auth/me
  fastify.get('/me', async (request, reply) => {
    try {
      await fastify.authenticate(request, reply);
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

  // PUT /api/auth/profile
  fastify.put('/profile', async (request, reply) => {
    try {
      await fastify.authenticate(request, reply);
      const userId = request.user.id;

      const profileSchema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email address'),
      });

      const validated = profileSchema.parse(request.body);
      const user = await authService.updateProfile(userId, validated);

      return reply.status(200).send(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0].message,
          },
        });
      }
      return reply.status(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile',
        },
      });
    }
  });
};
