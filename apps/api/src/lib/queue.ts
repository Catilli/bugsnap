import { Queue, Worker, Job } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL;

// Shared Redis connection config for BullMQ
const connection = REDIS_URL
  ? (() => {
      const url = new URL(REDIS_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
      };
    })()
  : undefined;

/**
 * Background job queues.
 * Returns null if REDIS_URL is not configured (queues require Redis).
 */

// --- Email notification queue ---
export const emailQueue = connection
  ? new Queue('bugsnap:email', { connection })
  : null;

// --- Screenshot processing queue ---
export const screenshotQueue = connection
  ? new Queue('bugsnap:screenshot', { connection })
  : null;

// --- Cleanup queue (expired tokens, old data) ---
export const cleanupQueue = connection
  ? new Queue('bugsnap:cleanup', { connection })
  : null;

/**
 * Add a job to a queue. No-op if queue is not available (Redis not configured).
 */
export async function enqueue(
  queue: Queue | null,
  jobName: string,
  data: Record<string, unknown>,
  opts?: { delay?: number; attempts?: number }
): Promise<void> {
  if (!queue) return;
  await queue.add(jobName, data, {
    attempts: opts?.attempts ?? 3,
    backoff: { type: 'exponential', delay: 1000 },
    delay: opts?.delay,
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

/**
 * Start background workers. Call this once on server startup.
 * Workers process jobs from their respective queues.
 */
export function startWorkers(): void {
  if (!connection) {
    console.log('REDIS_URL not set — background job workers disabled');
    return;
  }

  // Email worker
  new Worker(
    'bugsnap:email',
    async (job: Job) => {
      const { to, subject, html } = job.data;
      try {
        // Lazy import to avoid circular dependency issues
        const { emailService } = await import('../services/emailService');
        await emailService.sendEmail(to, subject, html);
      } catch (error) {
        console.error(`[email] Failed to send to=${to} subject="${subject}":`, error);
        throw error; // BullMQ will retry
      }
    },
    { connection, concurrency: 5 }
  );

  // Screenshot processing worker
  new Worker(
    'bugsnap:screenshot',
    async (job: Job) => {
      const { taskId, screenshotUrl } = job.data;
      // TODO: Download screenshot, optimize, re-upload to Cloudinary
      console.log(`[screenshot] Would process task=${taskId} url=${screenshotUrl}`);
    },
    { connection, concurrency: 2 }
  );

  // Cleanup worker
  new Worker(
    'bugsnap:cleanup',
    async (job: Job) => {
      const { action } = job.data;
      // TODO: Implement cleanup actions (purge old sessions, etc.)
      console.log(`[cleanup] Would run action=${action}`);
    },
    { connection, concurrency: 1 }
  );

  console.log('Background job workers started');
}

/**
 * Gracefully close all queues and workers.
 */
export async function closeQueues(): Promise<void> {
  const queues = [emailQueue, screenshotQueue, cleanupQueue].filter(Boolean) as Queue[];
  await Promise.all(queues.map((q) => q.close()));
}
