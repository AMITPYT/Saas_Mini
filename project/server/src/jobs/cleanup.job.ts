import { Job, Worker } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';
import { QUEUE_NAMES } from '../config/queue';
import { RefreshToken } from '../models/RefreshToken';
import { AuditLog } from '../models/AuditLog';
import { File } from '../models/File';

type CleanupOperation =
  | 'cleanup-sessions'
  | 'cleanup-audit-logs'
  | 'cleanup-orphan-files'
  | 'cleanup-archived-data';

interface CleanupJobData {
  operation: CleanupOperation;
  options?: Record<string, unknown>;
}

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

// Clean up expired refresh tokens
const cleanupExpiredSessions = async (): Promise<number> => {
  const result = await RefreshToken.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    ],
  });

  logger.info(`[CLEANUP] Removed ${result.deletedCount} expired/revoked refresh tokens`);
  return result.deletedCount;
};

// Clean up old audit logs (keep last 90 days)
const cleanupOldAuditLogs = async (): Promise<number> => {
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const result = await AuditLog.deleteMany({
    createdAt: { $lt: cutoffDate },
  });

  logger.info(`[CLEANUP] Removed ${result.deletedCount} old audit logs`);
  return result.deletedCount;
};

// Clean up orphan files (files without references)
const cleanupOrphanFiles = async (): Promise<number> => {
  // Find files older than 24 hours that aren't attached to anything
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orphanFiles = await File.find({
    resourceType: null,
    resourceId: null,
    createdAt: { $lt: cutoffDate },
  });

  let deletedCount = 0;

  for (const file of orphanFiles) {
    try {
      // Delete physical file
      const filePath = path.join(config.upload.path, file.path);
      await fs.unlink(filePath).catch(() => {
        // File might not exist, continue
      });

      // Delete database record
      await File.findByIdAndDelete(file._id);
      deletedCount++;
    } catch (error) {
      logger.error(`[CLEANUP] Failed to delete orphan file ${file._id}:`, error);
    }
  }

  logger.info(`[CLEANUP] Removed ${deletedCount} orphan files`);
  return deletedCount;
};

// Archive/remove old archived data
const cleanupArchivedData = async (): Promise<void> => {
  // In production, you might:
  // - Move very old archived items to cold storage
  // - Permanently delete items archived for > 30 days
  // - Generate reports before deletion

  logger.info('[CLEANUP] Archived data cleanup completed');
};

// Process cleanup jobs
const processCleanupJob = async (job: Job<CleanupJobData>): Promise<Record<string, unknown>> => {
  const { operation } = job.data;

  logger.info(`[CLEANUP] Starting cleanup operation: ${operation}`);

  let result: Record<string, unknown> = {};

  switch (operation) {
    case 'cleanup-sessions':
      result.deletedSessions = await cleanupExpiredSessions();
      break;

    case 'cleanup-audit-logs':
      result.deletedLogs = await cleanupOldAuditLogs();
      break;

    case 'cleanup-orphan-files':
      result.deletedFiles = await cleanupOrphanFiles();
      break;

    case 'cleanup-archived-data':
      await cleanupArchivedData();
      result.completed = true;
      break;

    default:
      throw new Error(`Unknown cleanup operation: ${operation}`);
  }

  logger.info(`[CLEANUP] Completed ${operation}:`, result);
  return result;
};

// Create cleanup worker
export const createCleanupWorker = (): Worker => {
  const worker = new Worker(QUEUE_NAMES.CLEANUP, processCleanupJob, {
    connection,
    concurrency: 1, // Run cleanup jobs sequentially
  });

  worker.on('completed', (job, result) => {
    logger.info(`Cleanup job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Cleanup job ${job?.id} failed:`, err);
  });

  return worker;
};

// Manual cleanup triggers
export const triggerSessionCleanup = async (): Promise<void> => {
  const { cleanupQueue, addJob } = await import('../config/queue');
  await addJob(cleanupQueue, 'manual-session-cleanup', {
    operation: 'cleanup-sessions',
  });
};

export const triggerAuditLogCleanup = async (): Promise<void> => {
  const { cleanupQueue, addJob } = await import('../config/queue');
  await addJob(cleanupQueue, 'manual-audit-cleanup', {
    operation: 'cleanup-audit-logs',
  });
};

export const triggerOrphanFileCleanup = async (): Promise<void> => {
  const { cleanupQueue, addJob } = await import('../config/queue');
  await addJob(cleanupQueue, 'manual-orphan-cleanup', {
    operation: 'cleanup-orphan-files',
  });
};
