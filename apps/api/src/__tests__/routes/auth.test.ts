import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { authRoutes } from '../../routes/auth';
import { authService } from '../../services/authService';

// Mock auth service
vi.mock('../../services/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    getUserById: vi.fn(),
  },
}));

describe('Auth Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    
    // Register JWT plugin
    await app.register(fastifyJwt, {
      secret: 'test-secret-key',
    });

    // Register auth routes
    await app.register(authRoutes, { prefix: '/auth' });

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
      };

      vi.mocked(authService.register).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('token');
      expect(body.user.email).toBe('test@example.com');
    });

    it('should fail with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'not-an-email',
          password: 'password123',
          name: 'Test User',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with missing fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member' as const,
      };

      vi.mocked(authService.login).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('token');
      expect(body.user.email).toBe('test@example.com');
    });

    it('should fail with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'not-an-email',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message');
      expect(body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /auth/me', () => {
    it('should get current user with valid token', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
      };

      vi.mocked(authService.getUserById).mockResolvedValue(mockUser);

      // Generate a valid token
      const token = app.jwt.sign({
        id: '123',
        email: 'test@example.com',
        role: 'member',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.email).toBe('test@example.com');
      expect(authService.getUserById).toHaveBeenCalledWith('123');
    });

    it('should fail without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with expired token', async () => {
      // Create an expired token
      const token = app.jwt.sign(
        {
          id: '123',
          email: 'test@example.com',
          role: 'member',
        },
        { expiresIn: '0s' }
      );

      // Wait a moment to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});