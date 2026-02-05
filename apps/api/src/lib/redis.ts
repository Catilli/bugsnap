import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Get or create the Redis connection.
 * Returns null if REDIS_URL is not configured (caching is optional).
 */
export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    redis.connect().catch(() => {
      // Connection failure is non-fatal — app works without cache
      console.warn('Redis unavailable — caching disabled');
      redis = null;
    });
  }

  return redis;
}

/**
 * Cache helper — get a value, or compute and store it if missing.
 * If Redis is unavailable, always runs the compute function (no caching).
 */
export async function cacheGet<T>(
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<T> {
  const client = getRedis();

  if (client) {
    try {
      const cached = await client.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // Redis read failure — fall through to compute
    }
  }

  const result = await computeFn();

  if (client) {
    try {
      await client.set(key, JSON.stringify(result), 'EX', ttlSeconds);
    } catch {
      // Redis write failure — non-fatal
    }
  }

  return result;
}

/**
 * Invalidate cache entries by pattern.
 * Uses SCAN to avoid blocking Redis with KEYS command.
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    // Invalidation failure — non-fatal, cache will expire naturally via TTL
  }
}

/**
 * Disconnect Redis on shutdown.
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
