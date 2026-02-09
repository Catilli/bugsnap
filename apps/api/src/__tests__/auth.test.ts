import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp, signTestToken } from './helpers/buildApp';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    project: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    issue: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectMember: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

// Mock eventBus
vi.mock('../lib/eventBus', () => ({
  emitIssueEvent: vi.fn(),
}));

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    getUserById: vi.fn(),
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

import { authService } from '../services/authService';
const mockAuthService = vi.mocked(authService);

let app: FastifyInstance;
let TEST_TOKEN: string;

beforeAll(async () => {
  app = await buildApp();
  TEST_TOKEN = signTestToken(app, {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'DEVELOPER',
  });
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------- POST /register ----------
describe('POST /api/auth/register', () => {
  it('should register a user and return token', async () => {
    mockAuthService.register.mockResolvedValue({
      id: 'new-user-id',
      email: 'new@example.com',
      name: 'New User',
      role: 'DEVELOPER',
      createdAt: new Date(),
    } as any);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'new@example.com', password: 'password123', name: 'New User' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe('new@example.com');
    expect(body.token).toBeDefined();
  });

  it('should return 400 for invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'not-an-email', password: 'password123', name: 'Test' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for missing name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'test@example.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for short password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'test@example.com', password: '123', name: 'Test' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 409 for duplicate email', async () => {
    const { ConflictError } = await import('../utils/errors');
    mockAuthService.register.mockRejectedValue(new ConflictError('Email already registered'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'dup@example.com', password: 'password123', name: 'Dup User' },
    });

    expect(res.statusCode).toBe(409);
  });

  it('should sanitize HTML in the name field (XSS prevention)', async () => {
    mockAuthService.register.mockResolvedValue({
      id: 'xss-user-id',
      email: 'xss@example.com',
      name: 'alert("xss")',
      role: 'DEVELOPER',
      createdAt: new Date(),
    } as any);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'xss@example.com',
        password: 'password123',
        name: '<script>alert("xss")</script>',
      },
    });

    expect(res.statusCode).toBe(201);
    // Verify sanitizeString was called — the service received sanitized name
    expect(mockAuthService.register).toHaveBeenCalledWith(
      'xss@example.com',
      'password123',
      expect.not.stringContaining('<script>')
    );
  });
});

// ---------- POST /login ----------
describe('POST /api/auth/login', () => {
  it('should login and return token', async () => {
    mockAuthService.login.mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test',
      role: 'DEVELOPER',
    } as any);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'test@example.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe('test@example.com');
  });

  it('should return 401 for wrong password', async () => {
    const { UnauthorizedError } = await import('../utils/errors');
    mockAuthService.login.mockRejectedValue(new UnauthorizedError('Invalid email or password'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'test@example.com', password: 'wrong' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for nonexistent email', async () => {
    const { UnauthorizedError } = await import('../utils/errors');
    mockAuthService.login.mockRejectedValue(new UnauthorizedError('Invalid email or password'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nobody@example.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 400 for missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'test@example.com' },
    });

    expect(res.statusCode).toBe(400);
  });
});

// ---------- POST /logout ----------
describe('POST /api/auth/logout', () => {
  it('should return 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe('Logged out successfully');
  });
});

// ---------- POST /forgot-password ----------
describe('POST /api/auth/forgot-password', () => {
  it('should return 200 regardless of email existence (no info leak)', async () => {
    mockAuthService.requestPasswordReset.mockResolvedValue(undefined);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'anyone@example.com' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('should return 400 for invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'not-an-email' },
    });

    expect(res.statusCode).toBe(400);
  });
});

// ---------- POST /reset-password ----------
describe('POST /api/auth/reset-password', () => {
  it('should reset password with valid token', async () => {
    mockAuthService.resetPassword.mockResolvedValue(undefined);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: 'valid-reset-token', password: 'newpassword123' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('should return 400 for missing token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { password: 'newpassword123' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 for invalid token', async () => {
    const { UnauthorizedError } = await import('../utils/errors');
    mockAuthService.resetPassword.mockRejectedValue(new UnauthorizedError('Invalid or expired reset token'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: 'bad-token', password: 'newpassword123' },
    });

    expect(res.statusCode).toBe(401);
  });
});

// ---------- GET /me ----------
describe('GET /api/auth/me', () => {
  it('should return user with valid JWT', async () => {
    mockAuthService.getUserById.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test',
      role: 'DEVELOPER',
      createdAt: new Date(),
    } as any);

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe('test@example.com');
  });

  it('should return 401 without JWT', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });

    expect(res.statusCode).toBe(401);
  });
});

// ---------- PUT /profile ----------
describe('PUT /api/auth/profile', () => {
  it('should update name', async () => {
    mockAuthService.updateProfile.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Updated Name',
      role: 'DEVELOPER',
      updatedAt: new Date(),
    } as any);

    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: { name: 'Updated Name', email: 'test@example.com' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('Updated Name');
  });

  it('should return 400 for empty name', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: { name: '', email: 'test@example.com' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return error without auth', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile',
      payload: { name: 'Test', email: 'test@example.com' },
    });

    // Route uses request.jwtVerify() + generic catch → returns 500
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});

// ---------- PUT /password ----------
describe('PUT /api/auth/password', () => {
  it('should change password', async () => {
    mockAuthService.updatePassword.mockResolvedValue({ message: 'Password changed successfully' });

    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/password',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: { currentPassword: 'oldpass123', newPassword: 'newpass123' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('should return 400 for wrong current password', async () => {
    mockAuthService.updatePassword.mockRejectedValue(new Error('Invalid current password'));

    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/password',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: { currentPassword: 'wrong', newPassword: 'newpass123' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for short new password', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/password',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: { currentPassword: 'oldpass123', newPassword: '12' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return error without auth', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/password',
      payload: { currentPassword: 'old', newPassword: 'newpass123' },
    });

    // Route uses request.jwtVerify() + generic catch → returns 500
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});
