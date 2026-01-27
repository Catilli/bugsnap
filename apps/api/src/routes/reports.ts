import { FastifyPluginAsync } from 'fastify';
import { validateBody } from '../middleware/validate';
import { createBugReportSchema, updateBugReportSchema } from '@bugsnap/shared';
import { reportService } from '../services/reportService';

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
  // All report routes require authentication
  // fastify.addHook('preHandler', fastify.authenticate);

  // POST /api/reports
  fastify.post(
    '/',
    {
      preHandler: validateBody(createBugReportSchema),
    },
    async (request, reply) => {
      const data = request.body as any;
      const userId = request.user.id;

      // For now, use a placeholder screenshot URL
      // In production, this would be uploaded to Cloudinary
      const screenshotUrl = data.screenshotUrl || 'https://via.placeholder.com/800x600';

      const report = await reportService.createReport({
        title: data.title,
        description: data.description,
        url: data.url,
        screenshotUrl,
        priority: data.priority,
        environmentData: data.environmentData,
        teamId: data.teamId,
        createdById: userId,
      });

      return reply.status(201).send({
        ...report,
        shareLink: `${process.env.FRONTEND_URL}/reports/${report.id}`,
      });
    }
  );

  // GET /api/reports/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const report = await reportService.getReportById(id, userId);

    return reply.status(200).send(report);
  });

  // PATCH /api/reports/:id
  fastify.patch(
    '/:id',
    {
      preHandler: validateBody(updateBugReportSchema),
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = request.body as any;
      const userId = request.user.id;

      const report = await reportService.updateReport(id, data, userId);

      return reply.status(200).send(report);
    }
  );

  // DELETE /api/reports/:id
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    await reportService.deleteReport(id, userId);

    return reply.status(204).send();
  });

  // GET /api/teams/:teamId/reports
  fastify.get('/teams/:teamId', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };
    const { status, priority, page, limit } = request.query as any;
    const userId = request.user.id;

    const result = await reportService.listReports(
      {
        teamId,
        status,
        priority,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      },
      userId
    );

    return reply.status(200).send(result);
  });
};