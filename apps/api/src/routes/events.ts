import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { onTaskEvent, TaskEvent } from '../lib/eventBus';
import { verifyClerkToken } from '../plugins/clerkAuth';

export async function eventRoutes(fastify: FastifyInstance) {
  // GET /api/projects/:projectId/events?token=CLERK_TOKEN — SSE endpoint for live task updates
  // Accepts token via query param since EventSource doesn't support custom headers
  fastify.get('/projects/:projectId/events', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { token } = request.query as { token?: string };

    // Verify Clerk token from query param or Authorization header
    let userId: string;
    try {
      const tokenToVerify = token || request.headers.authorization?.slice(7);
      if (!tokenToVerify) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { clerkId } = await verifyClerkToken(tokenToVerify);
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      userId = user.id;
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Verify user has access to project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const isOwner = project.createdById === userId;
    const isMember = project.members.some((m: any) => m.userId === userId);
    if (!isOwner && !isMember) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': request.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
    });

    // Send initial ping
    reply.raw.write('data: {"type":"connected"}\n\n');

    // Keep-alive interval
    const keepAlive = setInterval(() => {
      reply.raw.write(': keepalive\n\n');
    }, 30000);

    // Subscribe to events for this project
    const listener = (event: TaskEvent) => {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const unsubscribe = onTaskEvent(projectId, listener);

    // Cleanup on connection close
    request.raw.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  });
}
