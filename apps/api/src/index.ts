import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { errorHandler } from './plugins/errorHandler';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './routes/auth';
import { projectMemberRoutes } from './routes/projectMembers';
import { projectRoutes } from './routes/projects';
import { taskRoutes } from './routes/tasks';
import { feedbackRoutes } from './routes/feedback';

dotenv.config();

const fastify = Fastify({
  logger: true,
  bodyLimit: 50 * 1024 * 1024, // 50MB to handle large screenshots
});

// Register JWT first (before other plugins that might need it)
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
});

// Register CORS plugin with explicit configuration
fastify.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow production domain
    if (origin.includes('leidback.viewourdesign.info')) {
      return callback(null, true);
    }

    // Allow Vercel deployment domains (*.vercel.app)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }

    // Allow Render deployment domains (*.onrender.com)
    if (origin.includes('.onrender.com')) {
      return callback(null, true);
    }

    // Allow chrome-extension:// origins for the extension
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }

    // Allow all origins for extension to work on any website
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
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

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();