import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Sentry before anything else
import { initSentry } from './lib/sentry';
initSentry();

import { errorHandler } from './plugins/errorHandler';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './routes/auth';
import { projectMemberRoutes } from './routes/projectMembers';
import { projectRoutes } from './routes/projects';
import { issueRoutes } from './routes/issues';
import { feedbackRoutes } from './routes/feedback';
import { uploadRoutes } from './routes/uploads';
import { eventRoutes } from './routes/events';
import { commentRoutes } from './routes/comments';
import { notificationRoutes } from './routes/notifications';
import { shareRoutes } from './routes/share';
import { userRoutes } from './routes/users';
import { adminRoutes } from './routes/admin';
import { qaCycleRoutes } from './routes/qaCycles';
import { disconnectRedis } from './lib/redis';
import { startWorkers, closeQueues } from './lib/queue';
import { validateJwtSecret } from './utils/validateEnv';
import { getHealthReport } from './services/healthCheck';
import { healthMonitor } from './services/healthMonitor';

// Validate JWT_SECRET (existence + strength)
const jwtSecret = validateJwtSecret();

const isDev = process.env.NODE_ENV !== 'production';

const fastify = Fastify({
  logger: isDev
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
            colorize: true,
          },
        },
      }
    : {
        level: 'info',
      },
  bodyLimit: 50 * 1024 * 1024, // 50MB to handle large screenshots
});

// Item 5: CORS with explicit origin allowlist
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('WARNING: ALLOWED_ORIGINS is empty — all cross-origin browser requests will be blocked');
}

fastify.register(cors, {
  origin: (origin, callback) => {
    // Allow no-origin requests (curl, mobile apps)
    if (!origin) return callback(null, true);
    // Allow chrome-extension:// for the extension
    if (origin.startsWith('chrome-extension://')) return callback(null, true);
    // Allow localhost in development
    if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1')))
      return callback(null, true);
    // Check explicit allowlist
    if (allowedOrigins.some(allowed => origin.includes(allowed)))
      return callback(null, true);
    // Reject unknown origins (false = no CORS headers, browser blocks the request)
    callback(null, false);
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
});

// Item 2: Rate limiting — global 100 req/min, auth routes get stricter limits
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Register JWT plugin
fastify.register(fastifyJwt, {
  secret: jwtSecret,
});

fastify.register(errorHandler);
fastify.register(authPlugin);

// CSRF protection — require X-Requested-With header on state-changing requests.
// Browsers block cross-origin custom headers without a preflight that passes CORS,
// so a malicious site cannot forge these requests.
const CSRF_EXEMPT = new Set(['/health', '/api']);
fastify.addHook('onRequest', async (request, reply) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    // Exempt public endpoints (health check, shared links)
    if (CSRF_EXEMPT.has(request.url) || request.url.startsWith('/api/share/')) return;
    const xrw = request.headers['x-requested-with'];
    if (xrw !== 'BugSnap') {
      return reply.status(403).send({ error: 'Forbidden — missing CSRF header' });
    }
  }
});

// Security response headers
fastify.addHook('onSend', async (_request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('X-Frame-Options', 'DENY');
});

// Health check route
fastify.get('/health', async (_request, reply) => {
  const report = await getHealthReport();
  const statusCode = report.status === 'unhealthy' ? 503 : 200;
  return reply.status(statusCode).send(report);
});

// API routes
fastify.get('/api', async () => {
  return { message: 'BugSnap API v1.0', version: '1.0.0' };
});

// Register route modules
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(projectMemberRoutes, { prefix: '/api' }); // Register this first for /projects endpoint
fastify.register(projectRoutes, { prefix: '/api' });
fastify.register(issueRoutes, { prefix: '/api' });
fastify.register(feedbackRoutes, { prefix: '/api/feedback' });
fastify.register(uploadRoutes, { prefix: '/api' });
fastify.register(eventRoutes, { prefix: '/api' });
fastify.register(commentRoutes, { prefix: '/api' });
fastify.register(notificationRoutes, { prefix: '/api' });
fastify.register(shareRoutes, { prefix: '/api' });
fastify.register(userRoutes, { prefix: '/api' });
fastify.register(adminRoutes, { prefix: '/api' });
fastify.register(qaCycleRoutes, { prefix: '/api' });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    startWorkers();
    healthMonitor.start();
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  healthMonitor.stop();
  await fastify.close();
  await closeQueues();
  await disconnectRedis();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
