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

import { prisma } from './lib/prisma';
import { errorHandler } from './plugins/errorHandler';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './routes/auth';
import { projectMemberRoutes } from './routes/projectMembers';
import { projectRoutes } from './routes/projects';
import { taskRoutes } from './routes/tasks';
import { feedbackRoutes } from './routes/feedback';
import { uploadRoutes } from './routes/uploads';
import { oauthRoutes } from './routes/oauth';
import { eventRoutes } from './routes/events';
import { disconnectRedis } from './lib/redis';
import { startWorkers, closeQueues } from './lib/queue';

// Item 3: Fail hard if JWT_SECRET is not set
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

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
        // JSON output in production (pino default)
      },
  bodyLimit: 50 * 1024 * 1024, // 50MB to handle large screenshots
});

// Register JWT first (before other plugins that might need it)
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
});

// Item 5: CORS with explicit origin allowlist
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

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
    // Reject unknown origins
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

fastify.register(errorHandler);
fastify.register(authPlugin);

// Health check route
fastify.get('/health', async () => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', database: 'disconnected', timestamp: new Date().toISOString() };
  }
});

// API routes
fastify.get('/api', async () => {
  return { message: 'BugSnap API v1.0', version: '1.0.0' };
});

// Register route modules
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(projectMemberRoutes, { prefix: '/api' }); // Register this first for /projects endpoint
fastify.register(projectRoutes, { prefix: '/api' });
fastify.register(taskRoutes, { prefix: '/api' });
fastify.register(feedbackRoutes, { prefix: '/api/feedback' });
fastify.register(uploadRoutes, { prefix: '/api' });
fastify.register(oauthRoutes, { prefix: '/api/auth' });
fastify.register(eventRoutes, { prefix: '/api' });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    startWorkers();
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  await fastify.close();
  await closeQueues();
  await disconnectRedis();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();