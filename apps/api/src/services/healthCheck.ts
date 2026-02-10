import { prisma } from '../lib/prisma';
import { getRedis } from '../lib/redis';
import { emailQueue } from '../lib/queue';

export type ComponentStatus = 'healthy' | 'unhealthy' | 'unconfigured';

export interface ComponentHealth {
  status: ComponentStatus;
  latencyMs?: number;
  message?: string;
}

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    queues: ComponentHealth;
  };
}

export async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkRedis(): Promise<ComponentHealth> {
  const client = getRedis();
  if (!client) {
    return { status: 'unconfigured', message: 'REDIS_URL not set' };
  }

  const start = Date.now();
  try {
    await client.ping();
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkQueues(): Promise<ComponentHealth> {
  if (!emailQueue) {
    return { status: 'unconfigured', message: 'REDIS_URL not set' };
  }

  const start = Date.now();
  try {
    await emailQueue.getJobCounts();
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getHealthReport(): Promise<HealthReport> {
  const [dbResult, redisResult, queuesResult] = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkQueues(),
  ]);

  const database: ComponentHealth =
    dbResult.status === 'fulfilled'
      ? dbResult.value
      : { status: 'unhealthy', message: 'Check threw unexpectedly' };

  const redis: ComponentHealth =
    redisResult.status === 'fulfilled'
      ? redisResult.value
      : { status: 'unhealthy', message: 'Check threw unexpectedly' };

  const queues: ComponentHealth =
    queuesResult.status === 'fulfilled'
      ? queuesResult.value
      : { status: 'unhealthy', message: 'Check threw unexpectedly' };

  // Determine overall status
  let status: HealthReport['status'];
  if (database.status === 'unhealthy') {
    status = 'unhealthy';
  } else {
    const optionalDown =
      (redis.status === 'unhealthy') || (queues.status === 'unhealthy');
    status = optionalDown ? 'degraded' : 'healthy';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    components: { database, redis, queues },
  };
}
