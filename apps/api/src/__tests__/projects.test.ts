import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp, signTestToken } from './helpers/buildApp';

// Mock Prisma before any imports that use it
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
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock eventBus to avoid side effects
vi.mock('../lib/eventBus', () => ({
  emitIssueEvent: vi.fn(),
}));

import { prisma } from '../lib/prisma';

const mockPrisma = vi.mocked(prisma);

let app: FastifyInstance;
let TEST_TOKEN: string;

beforeAll(async () => {
  app = await buildApp();
  TEST_TOKEN = signTestToken(app, {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'MANAGER',
  });
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/projects', () => {
  it('should create a project with valid data', async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: 'project-1',
      name: 'Test Project',
      websiteUrl: 'https://example.com',
      createdById: 'test-user-id',
      createdBy: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: {
        name: 'Test Project',
        websiteUrl: 'https://example.com',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.name).toBe('Test Project');
    expect(body.websiteUrl).toBe('https://example.com');
  });

  it('should return 401 without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: {
        name: 'Test Project',
        websiteUrl: 'https://example.com',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 for invalid URL', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: {
        name: 'Test Project',
        websiteUrl: 'not-a-url',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for missing name', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: {
        websiteUrl: 'https://example.com',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /api/projects/:projectId', () => {
  it('should return project if user is owner', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      name: 'Test Project',
      websiteUrl: 'https://example.com',
      createdById: 'test-user-id',
      createdBy: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
      members: [],
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/project-1',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.name).toBe('Test Project');
  });

  it('should return project if user is a member', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      name: 'Other Project',
      websiteUrl: 'https://example.com',
      createdById: 'other-user-id',
      createdBy: { id: 'other-user-id', name: 'Other', email: 'other@example.com' },
      members: [{ userId: 'test-user-id', role: 'member' }],
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/project-1',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return 403 if user has no access', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      name: 'Private Project',
      createdById: 'other-user-id',
      members: [],
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/project-1',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 for non-existent project', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/nonexistent',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/project-1',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('DELETE /api/projects/:projectId', () => {
  it('should delete project if user is owner', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      createdById: 'test-user-id',
    } as any);
    mockPrisma.project.delete.mockResolvedValue({} as any);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/projects/project-1',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.message).toBe('Project deleted successfully');
  });

  it('should return 403 if user is not owner', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      createdById: 'other-user-id',
    } as any);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/projects/project-1',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 for non-existent project', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/projects/nonexistent',
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(response.statusCode).toBe(404);
  });
});
