import { Queue, Worker, QueueEvents } from 'bullmq';
import { config } from './index';
import { logger } from '../utils/logger';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  FILE_PROCESSING: 'file-processing',
  CLEANUP: 'cleanup',
  EXPORT: 'export',
} as const;

// Create queues
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection });
export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, { connection });
export const fileProcessingQueue = new Queue(QUEUE_NAMES.FILE_PROCESSING, { connection });
export const cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP, { connection });
export const exportQueue = new Queue(QUEUE_NAMES.EXPORT, { connection });

// Queue events for monitoring
export const createQueueEvents = (queueName: string): QueueEvents => {
  const events = new QueueEvents(queueName, { connection });

  events.on('completed', ({ jobId }) => {
    logger.debug(`Job ${jobId} completed in queue ${queueName}`);
  });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job ${jobId} failed in queue ${queueName}: ${failedReason}`);
  });

  return events;
};

// Helper to add jobs
export const addJob = async <T>(
  queue: Queue,
  name: string,
  data: T,
  options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
    backoff?: { type: 'exponential' | 'fixed'; delay: number };
  }
) => {
  return queue.add(name, data, {
    attempts: options?.attempts || 3,
    backoff: options?.backoff || { type: 'exponential', delay: 1000 },
    delay: options?.delay,
    priority: options?.priority,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  });
};

// Clean up old jobs
export const cleanupOldJobs = async (): Promise<void> => {
  const queues = [emailQueue, notificationQueue, fileProcessingQueue, cleanupQueue, exportQueue];

  for (const queue of queues) {
    try {
      await queue.clean(24 * 60 * 60 * 1000, 1000, 'completed'); // 24 hours
      await queue.clean(7 * 24 * 60 * 60 * 1000, 1000, 'failed'); // 7 days
    } catch (error) {
      logger.error(`Failed to clean queue ${queue.name}:`, error);
    }
  }
};

// Schedule recurring cleanup
export const scheduleCleanup = async (): Promise<void> => {
  // Clean expired sessions daily
  await addJob(cleanupQueue, 'cleanup-sessions', {}, {
    delay: 0,
  });

  // Add repeating job
  await cleanupQueue.add(
    'cleanup-sessions',
    {},
    {
      repeat: {
        pattern: '0 3 * * *', // Every day at 3 AM
      },
    }
  );

  // Clean old audit logs weekly
  await cleanupQueue.add(
    'cleanup-audit-logs',
    {},
    {
      repeat: {
        pattern: '0 4 * * 0', // Every Sunday at 4 AM
      },
    }
  );

  logger.info('Cleanup jobs scheduled');
};
