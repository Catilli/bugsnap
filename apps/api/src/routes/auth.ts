import { FastifyPluginAsync } from 'fastify';
import { loginSchema, registerSchema } from '@bugsnap/shared';
import { authService } from '../services/authService';
import { z } from 'zod';

// Stricter rate limit config for auth routes (10 req/min vs global 100)
const authRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute',
    },
  },
};

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/auth/register
  fastify.post(
    '/register',
    authRateLimit,
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
    authRateLimit,
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
  fastify.post('/logout', async (_request, reply) => {
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

  // PUT /api/auth/profile
  fastify.put('/profile', async (request, reply) => {
    try {
      await request.jwtVerify();
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

  // PUT /api/auth/password
  fastify.put('/password', async (request, reply) => {
    try {
      await request.jwtVerify();
      const userId = request.user.id;

      const passwordSchema = z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'Password must be at least 6 characters'),
      });

      const validated = passwordSchema.parse(request.body);
      await authService.updatePassword(userId, validated.currentPassword, validated.newPassword);

      return reply.status(200).send({
        message: 'Password updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0].message,
          },
        });
      }
      if (error instanceof Error && error.message === 'Invalid current password') {
        return reply.status(400).send({
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
          },
        });
      }
      return reply.status(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update password',
        },
      });
    }
  });
};