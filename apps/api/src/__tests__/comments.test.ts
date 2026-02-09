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

// Mock authService (needed because buildApp registers auth routes)
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

const ISSUE_ID = 'issue-111';
const PROJECT_ID = 'project-222';
const COMMENT_ID = 'comment-333';
const USER_ID = 'test-user-id';
const OTHER_USER_ID = 'other-user-id';

let app: FastifyInstance;
let devToken: string;
let viewerToken: string;

beforeAll(async () => {
  app = await buildApp();
  devToken = signTestToken(app, { id: USER_ID, email: 'dev@example.com', role: 'DEVELOPER' });
  viewerToken = signTestToken(app, { id: 'viewer-id', email: 'viewer@example.com', role: 'VIEWER' });
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper — standard issue mock with project
function mockIssueWithProject(createdById = USER_ID) {
  (mockPrisma.issue.findUnique as any).mockResolvedValue({
    id: ISSUE_ID,
    projectId: PROJECT_ID,
    title: 'Test Issue',
    project: { id: PROJECT_ID, createdById },
  });
}

// ---------- POST /issues/:id/comments ----------
describe('POST /api/issues/:id/comments', () => {
  it('should create a comment', async () => {
    mockIssueWithProject();
    (mockPrisma.projectMember.findFirst as any).mockResolvedValue({ userId: USER_ID, role: 'DEVELOPER' });
    (mockPrisma.comment.create as any).mockResolvedValue({
      id: COMMENT_ID,
      issueId: ISSUE_ID,
      userId: USER_ID,
      content: 'Nice work',
      user: { id: USER_ID, name: 'Dev', email: 'dev@example.com' },
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/issues/${ISSUE_ID}/comments`,
      headers: { authorization: `Bearer ${devToken}` },
      payload: { content: 'Nice work' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().content).toBe('Nice work');
  });

  it('should return 401 without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/issues/${ISSUE_ID}/comments`,
      payload: { content: 'hello' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 for VIEWER role', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/issues/${ISSUE_ID}/comments`,
      headers: { authorization: `Bearer ${viewerToken}` },
      payload: { content: 'hello' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('should return 404 when issue does not exist', async () => {
    (mockPrisma.issue.findUnique as any).mockResolvedValue(null);

    const res = await app.inject({
      method: 'POST',
      url: `/api/issues/${ISSUE_ID}/comments`,
      headers: { authorization: `Bearer ${devToken}` },
      payload: { content: 'hello' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('should return 403 when user has no project access', async () => {
    mockIssueWithProject(OTHER_USER_ID);
    (mockPrisma.projectMember.findFirst as any).mockResolvedValue(null);

    const res = await app.inject({
      method: 'POST',
      url: `/api/issues/${ISSUE_ID}/comments`,
      headers: { authorization: `Bearer ${devToken}` },
      payload: { content: 'hello' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('should return 400 for empty content', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/issues/${ISSUE_ID}/comments`,
      headers: { authorization: `Bearer ${devToken}` },
      payload: { content: '' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should sanitize HTML in comment content (XSS prevention)', async () => {
    mockIssueWithProject();
    (mockPrisma.projectMember.findFirst as any).mockResolvedValue({ userId: USER_ID, role: 'DEVELOPER' });
    (mockPrisma.comment.create as any).mockImplementation(({ data }: any) => ({
      id: COMMENT_ID,
      issueId: ISSUE_ID,
      userId: USER_ID,
      content: data.content,
      user: { id: USER_ID, name: 'Dev', email: 'dev@example.com' },
    }));

    const res = await app.inject({
      method: 'POST',
      url: `/api/issues/${ISSUE_ID}/comments`,
      headers: { authorization: `Bearer ${devToken}` },
      payload: { content: '<b>bold</b> and <script>alert("xss")</script>' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.content).not.toContain('<script>');
    expect(body.content).not.toContain('<b>');
  });
});

// ---------- GET /issues/:id/comments ----------
describe('GET /api/issues/:id/comments', () => {
  it('should list comments', async () => {
    mockIssueWithProject();
    (mockPrisma.projectMember.findFirst as any).mockResolvedValue({ userId: USER_ID });
    (mockPrisma.comment.findMany as any).mockResolvedValue([
      { id: 'c1', content: 'first', user: { id: USER_ID, name: 'Dev', email: 'dev@example.com' } },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: `/api/issues/${ISSUE_ID}/comments`,
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });

  it('should return 401 without auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/issues/${ISSUE_ID}/comments`,
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 404 when issue not found', async () => {
    (mockPrisma.issue.findUnique as any).mockResolvedValue(null);

    const res = await app.inject({
      method: 'GET',
      url: `/api/issues/${ISSUE_ID}/comments`,
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(res.statusCode).toBe(404);
  });

  it('should return 403 when user has no access', async () => {
    mockIssueWithProject(OTHER_USER_ID);
    (mockPrisma.projectMember.findFirst as any).mockResolvedValue(null);

    const res = await app.inject({
      method: 'GET',
      url: `/api/issues/${ISSUE_ID}/comments`,
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(res.statusCode).toBe(403);
  });
});

// ---------- PATCH /comments/:id ----------
describe('PATCH /api/comments/:id', () => {
  it('should update comment as author', async () => {
    (mockPrisma.comment.findUnique as any).mockResolvedValue({
      id: COMMENT_ID,
      userId: USER_ID,
      content: 'old',
    });
    (mockPrisma.comment.update as any).mockResolvedValue({
      id: COMMENT_ID,
      userId: USER_ID,
      content: 'updated',
      user: { id: USER_ID, name: 'Dev', email: 'dev@example.com' },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/comments/${COMMENT_ID}`,
      headers: { authorization: `Bearer ${devToken}` },
      payload: { content: 'updated' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().content).toBe('updated');
  });

  it('should return 403 for non-author', async () => {
    (mockPrisma.comment.findUnique as any).mockResolvedValue({
      id: COMMENT_ID,
      userId: OTHER_USER_ID,
      content: 'old',
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/comments/${COMMENT_ID}`,
      headers: { authorization: `Bearer ${devToken}` },
      payload: { content: 'hacked' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('should return 404 for nonexistent comment', async () => {
    (mockPrisma.comment.findUnique as any).mockResolvedValue(null);

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/comments/${COMMENT_ID}`,
      headers: { authorization: `Bearer ${devToken}` },
      payload: { content: 'test' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('should return 400 for empty content', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/comments/${COMMENT_ID}`,
      headers: { authorization: `Bearer ${devToken}` },
      payload: { content: '' },
    });

    expect(res.statusCode).toBe(400);
  });
});

// ---------- DELETE /comments/:id ----------
describe('DELETE /api/comments/:id', () => {
  it('should delete comment as author', async () => {
    (mockPrisma.comment.findUnique as any).mockResolvedValue({
      id: COMMENT_ID,
      userId: USER_ID,
      issue: { project: { createdById: OTHER_USER_ID } },
      feedback: null,
    });
    (mockPrisma.comment.delete as any).mockResolvedValue({});

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${COMMENT_ID}`,
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it('should delete comment as project owner', async () => {
    (mockPrisma.comment.findUnique as any).mockResolvedValue({
      id: COMMENT_ID,
      userId: OTHER_USER_ID,
      issue: { project: { createdById: USER_ID } },
      feedback: null,
    });
    (mockPrisma.comment.delete as any).mockResolvedValue({});

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${COMMENT_ID}`,
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it('should return 403 for unauthorized user', async () => {
    (mockPrisma.comment.findUnique as any).mockResolvedValue({
      id: COMMENT_ID,
      userId: OTHER_USER_ID,
      issue: { project: { createdById: OTHER_USER_ID } },
      feedback: null,
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${COMMENT_ID}`,
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('should return 404 for nonexistent comment', async () => {
    (mockPrisma.comment.findUnique as any).mockResolvedValue(null);

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${COMMENT_ID}`,
      headers: { authorization: `Bearer ${devToken}` },
    });

    expect(res.statusCode).toBe(404);
  });
});
