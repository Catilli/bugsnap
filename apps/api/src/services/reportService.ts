import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import type { BugReportStatus, BugReportPriority, EnvironmentData } from '@bugsnap/shared';

interface CreateReportData {
  title: string;
  description: string;
  url: string;
  screenshotUrl: string;
  priority: BugReportPriority;
  environmentData: EnvironmentData;
  teamId: string;
  createdById: string;
}

interface UpdateReportData {
  title?: string;
  description?: string;
  status?: BugReportStatus;
  priority?: BugReportPriority;
}

interface ListReportsFilters {
  teamId: string;
  status?: BugReportStatus;
  priority?: BugReportPriority;
  page?: number;
  limit?: number;
}

export class ReportService {
  /**
   * Create a new bug report
   */
  async createReport(data: CreateReportData) {
    // Verify user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: data.teamId,
        userId: data.createdById,
      },
    });

    if (!teamMember) {
      throw new ForbiddenError('You are not a member of this team');
    }

    const report = await prisma.bugReport.create({
      data: {
        title: data.title,
        description: data.description,
        url: data.url,
        screenshotUrl: data.screenshotUrl,
        priority: data.priority,
        status: 'open',
        environmentData: data.environmentData as any,
        teamId: data.teamId,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return report;
  }

  /**
   * Get a single bug report by ID
   */
  async getReportById(reportId: string, userId: string) {
    const report = await prisma.bugReport.findUnique({
      where: { id: reportId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        annotations: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundError('Bug report');
    }

    // Verify user has access to this report (is a team member)
    await this.verifyTeamAccess(report.teamId, userId);

    return report;
  }

  /**
   * List bug reports for a team with filters
   */
  async listReports(filters: ListReportsFilters, userId: string) {
    // Verify user has access to this team
    await this.verifyTeamAccess(filters.teamId, userId);

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    const where: any = {
      teamId: filters.teamId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    const [reports, total] = await Promise.all([
      prisma.bugReport.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.bugReport.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a bug report
   */
  async updateReport(reportId: string, data: UpdateReportData, userId: string) {
    const report = await prisma.bugReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundError('Bug report');
    }

    // Verify user has access to this team
    await this.verifyTeamAccess(report.teamId, userId);

    const updatedReport = await prisma.bugReport.update({
      where: { id: reportId },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedReport;
  }

  /**
   * Delete a bug report
   */
  async deleteReport(reportId: string, userId: string) {
    const report = await prisma.bugReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundError('Bug report');
    }

    // Only the creator or team admin can delete
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: report.teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenError('You do not have access to this team');
    }

    if (report.createdById !== userId && teamMember.role !== 'admin') {
      throw new ForbiddenError('Only the creator or team admin can delete this report');
    }

    await prisma.bugReport.delete({
      where: { id: reportId },
    });

    return { message: 'Bug report deleted successfully' };
  }

  /**
   * Verify user has access to a team
   */
  private async verifyTeamAccess(teamId: string, userId: string) {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenError('You do not have access to this team');
    }

    return teamMember;
  }
}

export const reportService = new ReportService();