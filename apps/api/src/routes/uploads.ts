import { FastifyInstance } from 'fastify';
import { uploadImage } from '../lib/cloudinary';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function uploadRoutes(fastify: FastifyInstance) {
  // POST /api/uploads — upload an image to Cloudinary
  fastify.post('/uploads', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
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
}
