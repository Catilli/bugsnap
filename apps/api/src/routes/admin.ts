import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireRole } from '../middleware/requireRole';

export async function adminRoutes(fastify: FastifyInstance) {
  // GET /api/admin/stats — System overview stats (ADMIN only)
  fastify.get('/admin/stats', {
    preHandler: [
      async (request, reply) => {
        try {
          await fastify.authenticate(request, reply);
        } catch (err) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      },
      requireRole('ADMIN'),
    ],
    handler: async (_request, reply) => {
      const [
        totalUsers,
        totalProjects,
        totalIssues,
        totalFeedback,
        usersByRoleRaw,
        issuesByStatusRaw,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.issue.count(),
        prisma.feedback.count(),
        prisma.user.groupBy({ by: ['role'], _count: true }),
        prisma.issue.groupBy({ by: ['status'], _count: true }),
      ]);

      const usersByRole: Record<string, number> = {};
      for (const row of usersByRoleRaw) {
        usersByRole[row.role] = row._count;
      }

      const issuesByStatus: Record<string, number> = {};
      for (const row of issuesByStatusRaw) {
        issuesByStatus[row.status] = row._count;
      }

      return reply.send({
        totalUsers,
        totalProjects,
        totalIssues,
        totalFeedback,
        usersByRole,
        issuesByStatus,
      });
    },
  });

  // GET /api/admin/export/issues — CSV export of all issues (ADMIN only)
  fastify.get('/admin/export/issues', {
    preHandler: [
      async (request, reply) => {
        try {
          await fastify.authenticate(request, reply);
        } catch (err) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      },
      requireRole('ADMIN'),
    ],
    handler: async (_request, reply) => {
      const issues = await prisma.issue.findMany({
        include: {
          project: { select: { name: true } },
          assignedTo: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const header = 'id,title,status,type,project,assignee,createdBy,createdAt';
      const rows = issues.map((issue) => {
        const escapeCsv = (val: string | null | undefined) => {
          if (val == null) return '';
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        };

        return [
          issue.id,
          escapeCsv(issue.title),
          issue.status,
          issue.type,
          escapeCsv(issue.project.name),
          escapeCsv(issue.assignedTo?.name || ''),
          escapeCsv(issue.createdBy.name),
          issue.createdAt.toISOString(),
        ].join(',');
      });

      const csv = [header, ...rows].join('\n');
      const dateStr = new Date().toISOString().split('T')[0];

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename=bugsnap-issues-${dateStr}.csv`)
        .send(csv);
    },
  });
}
