import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { reportRoutes } from '../../routes/reports';
import { reportService } from '../../services/reportService';
import { authPlugin } from '../../plugins/auth';

// Mock report service
vi.mock('../../services/reportService', () => ({
  reportService: {
    createReport: vi.fn(),
    getReportById: vi.fn(),
    listReports: vi.fn(),
    updateReport: vi.fn(),
    deleteReport: vi.fn(),
  },
}));

describe('Report Routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeEach(async () => {
    app = Fastify();
    
    // Register JWT plugin
    await app.register(fastifyJwt, {
      secret: 'test-secret-key',
    });

    // Register auth plugin
    await app.register(authPlugin);

    // Register report routes
    await app.register(reportRoutes, { prefix: '/reports' });

    // Generate test token
    token = app.jwt.sign({
      id: 'user-123',
      email: 'test@example.com',
      role: 'member',
    });

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /reports', () => {
    it('should create a bug report successfully', async () => {
      const mockReport = {
        id: 'report-123',
        title: 'Test Bug',
        description: 'Bug description',
        url: 'https://example.com',
        screenshotUrl: 'https://example.com/screenshot.png',
        priority: 'high' as const,
        status: 'open' as const,
        environmentData: {
          browser: 'Chrome',
          browserVersion: '120.0.0',
          os: 'Windows',
          screenResolution: '1920x1080',
          viewportSize: '1366x768',
          url: 'https://example.com',
          pageTitle: 'Test Page',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date().toISOString(),
          timezone: 'UTC',
        },
        teamId: 'team-123',
        createdById: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(reportService.createReport).mockResolvedValue(mockReport as any);

      const response = await app.inject({
        method: 'POST',
        url: '/reports',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          title: 'Test Bug',
          description: 'Bug description',
          url: 'https://example.com',
          priority: 'high',
          teamId: 'team-123',
          environmentData: {
            browser: 'Chrome',
            browserVersion: '120.0.0',
            os: 'Windows',
            screenResolution: '1920x1080',
            viewportSize: '1366x768',
            url: 'https://example.com',
            pageTitle: 'Test Page',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date().toISOString(),
            timezone: 'UTC',
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('report-123');
      expect(body).toHaveProperty('shareLink');
    });

    it('should fail with invalid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/reports',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          title: '',
          description: 'Bug description',
          url: 'not-a-url',
          priority: 'invalid-priority',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /reports/:id', () => {
    it('should get a bug report by id', async () => {
      const mockReport = {
        id: 'report-123',
        title: 'Test Bug',
        description: 'Bug description',
        url: 'https://example.com',
        screenshotUrl: 'https://example.com/screenshot.png',
        priority: 'high' as const,
        status: 'open' as const,
        environmentData: {},
        teamId: 'team-123',
        createdById: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
        team: {
          id: 'team-123',
          name: 'Test Team',
        },
        annotations: [],
        comments: [],
      };

      vi.mocked(reportService.getReportById).mockResolvedValue(mockReport as any);

      const response = await app.inject({
        method: 'GET',
        url: '/reports/report-123',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('report-123');
      expect(body.title).toBe('Test Bug');
      expect(reportService.getReportById).toHaveBeenCalledWith('report-123', 'user-123');
    });

    it('should return 404 for non-existent report', async () => {
      vi.mocked(reportService.getReportById).mockRejectedValue({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Bug report not found',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/reports/nonexistent',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /reports/:id', () => {
    it('should update a bug report', async () => {
      const mockUpdatedReport = {
        id: 'report-123',
        title: 'Updated Title',
        description: 'Updated description',
        status: 'in_progress' as const,
        priority: 'high' as const,
        createdBy: {
          id: 'user-123',
          name: 'Test User',
        },
      };

      vi.mocked(reportService.updateReport).mockResolvedValue(mockUpdatedReport as any);

      const response = await app.inject({
        method: 'PATCH',
        url: '/reports/report-123',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          title: 'Updated Title',
          status: 'in_progress',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.title).toBe('Updated Title');
      expect(body.status).toBe('in_progress');
      expect(reportService.updateReport).toHaveBeenCalledWith(
        'report-123',
        { title: 'Updated Title', status: 'in_progress' },
        'user-123'
      );
    });

    it('should fail with invalid update data', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/reports/report-123',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          status: 'invalid-status',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /reports/:id', () => {
    it('should delete a bug report', async () => {
      vi.mocked(reportService.deleteReport).mockResolvedValue({ 
        message: 'Bug report deleted successfully' 
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/reports/report-123',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(204);
      expect(reportService.deleteReport).toHaveBeenCalledWith('report-123', 'user-123');
    });

    it('should return 404 for non-existent report', async () => {
      vi.mocked(reportService.deleteReport).mockRejectedValue({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Bug report not found',
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/reports/nonexistent',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /reports/teams/:teamId', () => {
    it('should list reports for a team', async () => {
      const mockResult = {
        reports: [
          {
            id: 'report-1',
            title: 'Bug 1',
            createdBy: { id: 'user-123', name: 'User' },
            _count: { comments: 2 },
          },
          {
            id: 'report-2',
            title: 'Bug 2',
            createdBy: { id: 'user-123', name: 'User' },
            _count: { comments: 0 },
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      };

      vi.mocked(reportService.listReports).mockResolvedValue(mockResult as any);

      const response = await app.inject({
        method: 'GET',
        url: '/reports/teams/team-123',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.reports).toHaveLength(2);
      expect(body.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      const mockResult = {
        reports: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(reportService.listReports).mockResolvedValue(mockResult as any);

      const response = await app.inject({
        method: 'GET',
        url: '/reports/teams/team-123?status=open',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(reportService.listReports).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-123',
          status: 'open',
        }),
        'user-123'
      );
    });

    it('should filter by priority', async () => {
      const mockResult = {
        reports: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(reportService.listReports).mockResolvedValue(mockResult as any);

      const response = await app.inject({
        method: 'GET',
        url: '/reports/teams/team-123?priority=high',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(reportService.listReports).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-123',
          priority: 'high',
        }),
        'user-123'
      );
    });

    it('should paginate results', async () => {
      const mockResult = {
        reports: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      };

      vi.mocked(reportService.listReports).mockResolvedValue(mockResult as any);

      const response = await app.inject({
        method: 'GET',
        url: '/reports/teams/team-123?page=2&limit=10',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pagination.page).toBe(2);
      expect(body.pagination.limit).toBe(10);
    });
  });
});