import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp, getTestToken } from './helpers/buildApp';

// Mock Prisma before any imports that use it
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock bcrypt — use vi.hoisted so mocks are available when vi.mock factory runs
const { mockHash, mockCompare } = vi.hoisted(() => ({
  mockHash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
  mockCompare: vi.fn().mockResolvedValue(true),
}));

vi.mock('bcrypt', () => ({
  default: { hash: mockHash, compare: mockCompare },
  hash: mockHash,
  compare: mockCompare,
}));

import { prisma } from '../lib/prisma';

const mockPrisma = vi.mocked(prisma);

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
  // Re-apply default mock implementations after clearAllMocks
  mockHash.mockResolvedValue('$2b$10$hashedpassword');
  mockCompare.mockResolvedValue(true);
});

describe('POST /api/auth/register', () => {
  it('should register a new user and return token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user-id',
      email: 'new@example.com',
      name: 'New User',
      role: 'MANAGER',
      createdAt: new Date(),
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.user.email).toBe('new@example.com');
    expect(body.token).toBeDefined();
  });

  it('should return 409 if email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-id',
      email: 'existing@example.com',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      },
    });

    expect(response.statusCode).toBe(409);
    const body = response.json();
    expect(body.error.code).toBe('CONFLICT');
  });

  it('should return 400 for invalid email format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'not-an-email',
        password: 'password123',
        name: 'Test',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'test@example.com',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for short password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      name: 'Test User',
      password: '$2b$10$hashedpassword',
      role: 'MANAGER',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'user@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user.email).toBe('user@example.com');
    expect(body.token).toBeDefined();
  });

  it('should return 401 for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'nonexistent@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 for wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password: '$2b$10$hashedpassword',
      role: 'MANAGER',
    } as any);
    mockCompare.mockResolvedValue(false);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'user@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 401 for OAuth-only user trying password login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'oauth-user-id',
      email: 'oauth@example.com',
      password: null,
      role: 'MANAGER',
      oauthProvider: 'google',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'oauth@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user with valid token', async () => {
    const token = getTestToken(app);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'MANAGER',
      createdAt: new Date(),
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.email).toBe('test@example.com');
  });

  it('should return 401 without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('should return success message', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.message).toBe('Logged out successfully');
  });
});
