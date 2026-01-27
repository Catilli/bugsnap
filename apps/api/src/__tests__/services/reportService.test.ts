import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportService } from '../../services/reportService';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    bugReport: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    teamMember: {
      findFirst: vi.fn(),
    },
  },
}));

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    reportService = new ReportService();
    vi.clearAllMocks();
  });

  describe('createReport', () => {
    it('should create a bug report successfully', async () => {
      const reportData = {
        title: 'Test Bug',
        description: 'Bug description',
        url: 'https://example.com',
        screenshotUrl: 'https://example.com/screenshot.png',
        priority: 'high' as const,
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
      };

      const mockTeamMember = {
        id: 'tm-123',
        teamId: 'team-123',
        userId: 'user-123',
        role: 'member' as const,
        createdAt: new Date(),
      };

      const mockReport = {
        id: 'report-123',
        ...reportData,
        status: 'open' as const,
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
      };

      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(mockTeamMember as any);
      vi.mocked(prisma.bugReport.create).mockResolvedValue(mockReport as any);

      const result = await reportService.createReport(reportData);

      expect(prisma.teamMember.findFirst).toHaveBeenCalledWith({
        where: {
          teamId: reportData.teamId,
          userId: reportData.createdById,
        },
      });
      expect(prisma.bugReport.create).toHaveBeenCalled();
      expect(result.id).toBe('report-123');
      expect(result.title).toBe(reportData.title);
    });

    it('should throw ForbiddenError if user is not a team member', async () => {
      const reportData = {
        title: 'Test Bug',
        description: 'Bug description',
        url: 'https://example.com',
        screenshotUrl: 'https://example.com/screenshot.png',
        priority: 'high' as const,
        environmentData: {} as any,
        teamId: 'team-123',
        createdById: 'user-123',
      };

      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);

      await expect(
        reportService.createReport(reportData)
      ).rejects.toThrow(ForbiddenError);

      expect(prisma.bugReport.create).not.toHaveBeenCalled();
    });
  });

  describe('getReportById', () => {
    it('should return a bug report', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';

      const mockReport = {
        id: reportId,
        title: 'Test Bug',
        description: 'Bug description',
        url: 'https://example.com',
        screenshotUrl: 'https://example.com/screenshot.png',
        priority: 'high' as const,
        status: 'open' as const,
        environmentData: {},
        teamId: 'team-123',
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
          id: userId,
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

      const mockTeamMember = {
        id: 'tm-123',
        teamId: 'team-123',
        userId,
        role: 'member' as const,
        createdAt: new Date(),
      };

      vi.mocked(prisma.bugReport.findUnique).mockResolvedValue(mockReport as any);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(mockTeamMember as any);

      const result = await reportService.getReportById(reportId, userId);

      expect(result.id).toBe(reportId);
      expect(result.title).toBe('Test Bug');
    });

    it('should throw NotFoundError if report not found', async () => {
      vi.mocked(prisma.bugReport.findUnique).mockResolvedValue(null);

      await expect(
        reportService.getReportById('nonexistent', 'user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user lacks team access', async () => {
      const mockReport = {
        id: 'report-123',
        teamId: 'team-123',
      } as any;

      vi.mocked(prisma.bugReport.findUnique).mockResolvedValue(mockReport);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);

      await expect(
        reportService.getReportById('report-123', 'user-123')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('listReports', () => {
    it('should list reports with pagination', async () => {
      const filters = {
        teamId: 'team-123',
        page: 1,
        limit: 10,
      };
      const userId = 'user-123';

      const mockReports = [
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
      ];

      const mockTeamMember = {
        id: 'tm-123',
        teamId: 'team-123',
        userId,
        role: 'member' as const,
        createdAt: new Date(),
      };

      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(mockTeamMember as any);
      vi.mocked(prisma.bugReport.findMany).mockResolvedValue(mockReports as any);
      vi.mocked(prisma.bugReport.count).mockResolvedValue(15);

      const result = await reportService.listReports(filters, userId);

      expect(result.reports).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2,
      });
    });

    it('should filter by status', async () => {
      const filters = {
        teamId: 'team-123',
        status: 'open' as const,
      };
      const userId = 'user-123';

      const mockTeamMember = {
        id: 'tm-123',
        teamId: 'team-123',
        userId,
        role: 'member' as const,
        createdAt: new Date(),
      };

      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(mockTeamMember as any);
      vi.mocked(prisma.bugReport.findMany).mockResolvedValue([]);
      vi.mocked(prisma.bugReport.count).mockResolvedValue(0);

      await reportService.listReports(filters, userId);

      const findManyCall = vi.mocked(prisma.bugReport.findMany).mock.calls[0][0];
      expect(findManyCall?.where).toMatchObject({
        teamId: 'team-123',
        status: 'open',
      });
    });
  });

  describe('updateReport', () => {
    it('should update a bug report', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';
      const updateData = {
        title: 'Updated Title',
        status: 'in_progress' as const,
      };

      const mockReport = {
        id: reportId,
        teamId: 'team-123',
        title: 'Old Title',
      } as any;

      const mockTeamMember = {
        id: 'tm-123',
        teamId: 'team-123',
        userId,
        role: 'member' as const,
        createdAt: new Date(),
      };

      const mockUpdatedReport = {
        ...mockReport,
        ...updateData,
        createdBy: { id: userId, name: 'Test User' },
      };

      vi.mocked(prisma.bugReport.findUnique).mockResolvedValue(mockReport);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(mockTeamMember as any);
      vi.mocked(prisma.bugReport.update).mockResolvedValue(mockUpdatedReport as any);

      const result = await reportService.updateReport(reportId, updateData, userId);

      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe('in_progress');
    });

    it('should throw NotFoundError if report not found', async () => {
      vi.mocked(prisma.bugReport.findUnique).mockResolvedValue(null);

      await expect(
        reportService.updateReport('nonexistent', {}, 'user-123')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteReport', () => {
    it('should delete a report if user is creator', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';

      const mockReport = {
        id: reportId,
        teamId: 'team-123',
        createdById: userId,
      } as any;

      const mockTeamMember = {
        id: 'tm-123',
        teamId: 'team-123',
        userId,
        role: 'member' as const,
        createdAt: new Date(),
      };

      vi.mocked(prisma.bugReport.findUnique).mockResolvedValue(mockReport);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(mockTeamMember as any);
      vi.mocked(prisma.bugReport.delete).mockResolvedValue(mockReport);

      const result = await reportService.deleteReport(reportId, userId);

      expect(result).toEqual({ message: 'Bug report deleted successfully' });
      expect(prisma.bugReport.delete).toHaveBeenCalledWith({
        where: { id: reportId },
      });
    });

    it('should delete a report if user is team admin', async () => {
      const reportId = 'report-123';
      const userId = 'admin-123';

      const mockReport = {
        id: reportId,
        teamId: 'team-123',
        createdById: 'other-user',
      } as any;

      const mockTeamMember = {
        id: 'tm-123',
        teamId: 'team-123',
        userId,
        role: 'admin' as const,
        createdAt: new Date(),
      };

      vi.mocked(prisma.bugReport.findUnique).mockResolvedValue(mockReport);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(mockTeamMember as any);
      vi.mocked(prisma.bugReport.delete).mockResolvedValue(mockReport);

      const result = await reportService.deleteReport(reportId, userId);

      expect(result).toEqual({ message: 'Bug report deleted successfully' });
    });

    it('should throw ForbiddenError if user is not creator or admin', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';

      const mockReport = {
        id: reportId,
        teamId: 'team-123',
        createdById: 'other-user',
      } as any;

      const mockTeamMember = {
        id: 'tm-123',
        teamId: 'team-123',
        userId,
        role: 'member' as const,
        createdAt: new Date(),
      };

      vi.mocked(prisma.bugReport.findUnique).mockResolvedValue(mockReport);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(mockTeamMember as any);

      await expect(
        reportService.deleteReport(reportId, userId)
      ).rejects.toThrow(ForbiddenError);

      expect(prisma.bugReport.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if report not found', async () => {
      vi.mocked(prisma.bugReport.findUnique).mockResolvedValue(null);

      await expect(
        reportService.deleteReport('nonexistent', 'user-123')
      ).rejects.toThrow(NotFoundError);
    });
  });
});