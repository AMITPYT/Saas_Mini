import { Worker } from 'bullmq';
import { createEmailWorker } from './email.job';
import { createNotificationWorker } from './notification.job';
import { createFileProcessingWorker } from './file.job';
import { createCleanupWorker } from './cleanup.job';
import { scheduleCleanup } from '../config/queue';
import { logger } from '../utils/logger';

let workers: Worker[] = [];

export const initializeWorkers = async (): Promise<void> => {
  try {
    // Create workers
    const emailWorker = createEmailWorker();
    const notificationWorker = createNotificationWorker();
    const fileProcessingWorker = createFileProcessingWorker();
    const cleanupWorker = createCleanupWorker();

    workers = [emailWorker, notificationWorker, fileProcessingWorker, cleanupWorker];

    // Schedule recurring cleanup jobs
    await scheduleCleanup();

    logger.info('All job workers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize job workers:', error);
    throw error;
  }
};

export const shutdownWorkers = async (): Promise<void> => {
  logger.info('Shutting down job workers...');

  await Promise.all(
    workers.map(async (worker) => {
      try {
        await worker.close();
      } catch (error) {
        logger.error(`Failed to close worker ${worker.name}:`, error);
      }
    })
  );

  logger.info('All job workers shut down');
};

// Export job helpers
export * from './email.job';
export * from './notification.job';
export * from './file.job';
export * from './cleanup.job';
