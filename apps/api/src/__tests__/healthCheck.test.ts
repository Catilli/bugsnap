import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('../lib/prisma', () => ({
  prisma: { $queryRaw: vi.fn() },
}));

vi.mock('../lib/redis', () => ({
  getRedis: vi.fn(),
}));

vi.mock('../lib/queue', () => ({
  emailQueue: null,
  screenshotQueue: null,
  cleanupQueue: null,
}));

import { checkDatabase, checkRedis, checkQueues, getHealthReport } from '../services/healthCheck';
import { prisma } from '../lib/prisma';
import { getRedis } from '../lib/redis';
import * as queueModule from '../lib/queue';

const mockPrisma = prisma as unknown as { $queryRaw: ReturnType<typeof vi.fn> };
const mockGetRedis = getRedis as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('checkDatabase', () => {
  it('returns healthy when SELECT 1 succeeds', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const result = await checkDatabase();
    expect(result.status).toBe('healthy');
    expect(result.latencyMs).toBeTypeOf('number');
  });

  it('returns unhealthy when query fails', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
    const result = await checkDatabase();
    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Connection refused');
  });
});

describe('checkRedis', () => {
  it('returns unconfigured when getRedis returns null', async () => {
    mockGetRedis.mockReturnValue(null);
    const result = await checkRedis();
    expect(result.status).toBe('unconfigured');
    expect(result.message).toBe('REDIS_URL not set');
  });

  it('returns healthy when PING succeeds', async () => {
    mockGetRedis.mockReturnValue({ ping: vi.fn().mockResolvedValue('PONG') });
    const result = await checkRedis();
    expect(result.status).toBe('healthy');
    expect(result.latencyMs).toBeTypeOf('number');
  });

  it('returns unhealthy when PING fails', async () => {
    mockGetRedis.mockReturnValue({ ping: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) });
    const result = await checkRedis();
    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('ECONNREFUSED');
  });
});

describe('checkQueues', () => {
  it('returns unconfigured when emailQueue is null', async () => {
    const result = await checkQueues();
    expect(result.status).toBe('unconfigured');
    expect(result.message).toBe('REDIS_URL not set');
  });

  it('returns healthy when getJobCounts succeeds', async () => {
    // Temporarily override the emailQueue export
    const mockQueue = { getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0 }) };
    (queueModule as Record<string, unknown>).emailQueue = mockQueue;

    const result = await checkQueues();
    expect(result.status).toBe('healthy');

    // Restore
    (queueModule as Record<string, unknown>).emailQueue = null;
  });

  it('returns unhealthy when getJobCounts fails', async () => {
    const mockQueue = { getJobCounts: vi.fn().mockRejectedValue(new Error('Queue error')) };
    (queueModule as Record<string, unknown>).emailQueue = mockQueue;

    const result = await checkQueues();
    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Queue error');

    (queueModule as Record<string, unknown>).emailQueue = null;
  });
});

describe('getHealthReport', () => {
  it('returns healthy when all components pass', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockGetRedis.mockReturnValue(null); // unconfigured is fine

    const report = await getHealthReport();
    expect(report.status).toBe('healthy');
    expect(report.components.database.status).toBe('healthy');
    expect(report.components.redis.status).toBe('unconfigured');
    expect(report.components.queues.status).toBe('unconfigured');
    expect(report.timestamp).toBeTruthy();
  });

  it('returns unhealthy when DB is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB down'));
    mockGetRedis.mockReturnValue(null);

    const report = await getHealthReport();
    expect(report.status).toBe('unhealthy');
    expect(report.components.database.status).toBe('unhealthy');
  });

  it('returns degraded when DB is up but Redis is down', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockGetRedis.mockReturnValue({ ping: vi.fn().mockRejectedValue(new Error('Redis down')) });

    const report = await getHealthReport();
    expect(report.status).toBe('degraded');
    expect(report.components.database.status).toBe('healthy');
    expect(report.components.redis.status).toBe('unhealthy');
  });
});
