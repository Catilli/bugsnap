import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp, signTestToken } from './helpers/buildApp';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
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

import { prisma } from '../lib/prisma';
const mockPrisma = vi.mocked(prisma);

const USER_ID = 'test-user-id';

let app: FastifyInstance;
let devToken: string;

beforeAll(async () => {
  app = await buildApp();
  devToken = signTestToken(app, { id: USER_ID, email: 'dev@example.com', role: 'DEVELOPER' });
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/users/mentionable', () => {
  it('should return 401 when unauthenticated', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/users/mentionable',
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return user list with id, name, email for authenticated user', async () => {
    (mockPrisma.user.findMany as any).mockResolvedValue([
      { id: 'u1', name: 'Alice', email: 'alice@example.com' },
      { id: 'u2', name: 'Bob', email: 'bob@example.com' },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/users/mentionable',
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual({ id: 'u1', name: 'Alice', email: 'alice@example.com' });
    expect(body[1]).toEqual({ id: 'u2', name: 'Bob', email: 'bob@example.com' });
  });

  it('should NOT include password or sensitive fields', async () => {
    (mockPrisma.user.findMany as any).mockResolvedValue([
      { id: 'u1', name: 'Alice', email: 'alice@example.com' },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/users/mentionable',
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body[0]).not.toHaveProperty('password');
    expect(body[0]).not.toHaveProperty('passwordHash');
    expect(body[0]).not.toHaveProperty('role');
    expect(Object.keys(body[0])).toEqual(['id', 'name', 'email']);
  });

  it('should call prisma with correct select and orderBy', async () => {
    (mockPrisma.user.findMany as any).mockResolvedValue([]);

    await app.inject({
      method: 'GET',
      url: '/api/users/mentionable',
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  });
});
