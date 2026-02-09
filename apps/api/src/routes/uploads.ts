import { FastifyInstance } from 'fastify';
import { uploadImage } from '../lib/cloudinary';
import { prisma } from '../lib/prisma';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ATTACHMENT_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES,
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'video/mp4',
  'video/webm',
];

export async function uploadRoutes(fastify: FastifyInstance) {
  // POST /api/uploads — upload an image to Cloudinary
  fastify.post('/uploads', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return reply.status(400).send({
          error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        });
      }

      const buffer = await file.toBuffer();
      const result = await uploadImage(buffer, 'bugsnap');

      return reply.status(201).send({
        url: result.url,
        publicId: result.publicId,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to upload file' });
    }
  });

  // POST /api/issues/:issueId/attachments — upload file attachment to an issue
  fastify.post('/issues/:issueId/attachments', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { issueId } = request.params as { issueId: string };
      const userId = (request.user as any)?.id;
      const userRole = (request.user as any)?.role;

      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      if (userRole === 'VIEWER') return reply.status(403).send({ error: 'Viewers cannot upload attachments' });

      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: { project: { include: { members: true } } },
      });

      if (!issue) return reply.status(404).send({ error: 'Issue not found' });

      // Verify access
      const isAdmin = userRole === 'ADMIN';
      const isOwner = issue.project.createdById === userId;
      const isMember = issue.project.members.some((m: any) => m.userId === userId);
      if (!isAdmin && !isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this issue' });
      }

      const file = await request.file();
      if (!file) return reply.status(400).send({ error: 'No file uploaded' });

      if (!ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
        return reply.status(400).send({
          error: `Invalid file type. Allowed: ${ATTACHMENT_MIME_TYPES.join(', ')}`,
        });
      }

      const buffer = await file.toBuffer();
      const result = await uploadImage(buffer, 'bugsnap-attachments');

      const attachment = await prisma.attachment.create({
        data: {
          issueId,
          fileName: file.filename,
          fileUrl: result.url,
          fileType: file.mimetype,
          fileSize: buffer.length,
        },
      });

      return reply.status(201).send(attachment);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to upload attachment' });
    }
  });

  // GET /api/issues/:issueId/attachments — list attachments for an issue
  fastify.get('/issues/:issueId/attachments', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { issueId } = request.params as { issueId: string };

      const attachments = await prisma.attachment.findMany({
        where: { issueId },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(attachments);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch attachments' });
    }
  });

  // POST /api/feedback/:feedbackId/attachments — upload file attachment to feedback
  fastify.post('/feedback/:feedbackId/attachments', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { feedbackId } = request.params as { feedbackId: string };
      const userId = (request.user as any)?.id;
      const userRole = (request.user as any)?.role;

      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      if (userRole === 'VIEWER') return reply.status(403).send({ error: 'Viewers cannot upload attachments' });

      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) return reply.status(404).send({ error: 'Feedback not found' });

      const file = await request.file();
      if (!file) return reply.status(400).send({ error: 'No file uploaded' });

      if (!ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
        return reply.status(400).send({
          error: `Invalid file type. Allowed: ${ATTACHMENT_MIME_TYPES.join(', ')}`,
        });
      }

      const buffer = await file.toBuffer();
      const result = await uploadImage(buffer, 'bugsnap-attachments');

      const attachment = await prisma.attachment.create({
        data: {
          feedbackId,
          fileName: file.filename,
          fileUrl: result.url,
          fileType: file.mimetype,
          fileSize: buffer.length,
        },
      });

      return reply.status(201).send(attachment);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to upload attachment' });
    }
  });

  // GET /api/feedback/:feedbackId/attachments — list attachments for feedback
  fastify.get('/feedback/:feedbackId/attachments', {
    preHandler: async (request, reply) => {
      try {
        await fastify.authenticate(request, reply);
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { feedbackId } = request.params as { feedbackId: string };

      const attachments = await prisma.attachment.findMany({
        where: { feedbackId },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(attachments);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch attachments' });
    }
  });
}
