import { Job, Worker } from 'bullmq';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config';
import { logger } from '../utils/logger';
import { QUEUE_NAMES } from '../config/queue';
import { File } from '../models/File';

interface FileProcessingJobData {
  fileId: string;
  filePath: string;
  operation: 'thumbnail' | 'compress' | 'convert' | 'scan';
}

interface ThumbnailJobData extends FileProcessingJobData {
  operation: 'thumbnail';
  width: number;
  height: number;
}

interface CompressJobData extends FileProcessingJobData {
  operation: 'compress';
  quality: number;
}

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

// Generate thumbnail (placeholder - integrate with sharp or similar)
const generateThumbnail = async (
  filePath: string,
  width: number,
  height: number
): Promise<string> => {
  // In production, use sharp:
  // import sharp from 'sharp';
  // const thumbnailPath = filePath.replace(/\.[^.]+$/, '_thumb.jpg');
  // await sharp(filePath)
  //   .resize(width, height, { fit: 'cover' })
  //   .jpeg({ quality: 80 })
  //   .toFile(thumbnailPath);
  // return thumbnailPath;

  logger.info(`[FILE] Generating thumbnail for ${filePath} (${width}x${height})`);

  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 500));

  const thumbnailPath = filePath.replace(/\.[^.]+$/, '_thumb.jpg');
  logger.info(`[FILE] Thumbnail generated: ${thumbnailPath}`);

  return thumbnailPath;
};

// Compress image (placeholder)
const compressImage = async (filePath: string, quality: number): Promise<void> => {
  // In production, use sharp:
  // const buffer = await sharp(filePath)
  //   .jpeg({ quality })
  //   .toBuffer();
  // await fs.writeFile(filePath, buffer);

  logger.info(`[FILE] Compressing image ${filePath} with quality ${quality}`);
  await new Promise((resolve) => setTimeout(resolve, 300));
  logger.info(`[FILE] Image compressed: ${filePath}`);
};

// Scan file for viruses (placeholder)
const scanFile = async (filePath: string): Promise<boolean> => {
  // In production, integrate with:
  // - ClamAV
  // - VirusTotal API
  // - AWS GuardDuty

  logger.info(`[FILE] Scanning file for malware: ${filePath}`);
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Simulate clean file
  const isClean = true;
  logger.info(`[FILE] Scan complete. File is ${isClean ? 'clean' : 'infected'}: ${filePath}`);

  return isClean;
};

// Process file jobs
const processFileJob = async (job: Job<FileProcessingJobData>): Promise<void> => {
  const { fileId, filePath, operation } = job.data;

  logger.info(`[FILE] Processing file ${fileId}: ${operation}`);

  // Verify file exists
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  switch (operation) {
    case 'thumbnail': {
      const data = job.data as ThumbnailJobData;
      const thumbnailPath = await generateThumbnail(filePath, data.width, data.height);

      // Update file record with thumbnail path
      await File.findByIdAndUpdate(fileId, {
        $set: { 'metadata.thumbnailPath': thumbnailPath },
      });
      break;
    }

    case 'compress': {
      const data = job.data as CompressJobData;
      await compressImage(filePath, data.quality);

      // Update file size after compression
      const stats = await fs.stat(filePath);
      await File.findByIdAndUpdate(fileId, {
        $set: { size: stats.size },
      });
      break;
    }

    case 'scan': {
      const isClean = await scanFile(filePath);

      if (!isClean) {
        // Delete infected file
        await fs.unlink(filePath);
        await File.findByIdAndDelete(fileId);
        throw new Error('File is infected and has been removed');
      }

      // Mark file as scanned
      await File.findByIdAndUpdate(fileId, {
        $set: { 'metadata.scanned': true, 'metadata.scannedAt': new Date() },
      });
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};

// Create file processing worker
export const createFileProcessingWorker = (): Worker => {
  const worker = new Worker(QUEUE_NAMES.FILE_PROCESSING, processFileJob, {
    connection,
    concurrency: 3, // Limit concurrent file processing
  });

  worker.on('completed', (job) => {
    logger.debug(`File processing job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`File processing job ${job?.id} failed:`, err);
  });

  return worker;
};

// Helper functions to queue file processing
export const queueThumbnailGeneration = async (
  fileId: string,
  filePath: string,
  width: number = 200,
  height: number = 200
): Promise<void> => {
  const { fileProcessingQueue, addJob } = await import('../config/queue');
  await addJob(fileProcessingQueue, 'generate-thumbnail', {
    fileId,
    filePath,
    operation: 'thumbnail',
    width,
    height,
  } as ThumbnailJobData);
};

export const queueImageCompression = async (
  fileId: string,
  filePath: string,
  quality: number = 80
): Promise<void> => {
  const { fileProcessingQueue, addJob } = await import('../config/queue');
  await addJob(fileProcessingQueue, 'compress-image', {
    fileId,
    filePath,
    operation: 'compress',
    quality,
  } as CompressJobData);
};

export const queueFileScan = async (fileId: string, filePath: string): Promise<void> => {
  const { fileProcessingQueue, addJob } = await import('../config/queue');
  await addJob(
    fileProcessingQueue,
    'scan-file',
    {
      fileId,
      filePath,
      operation: 'scan',
    },
    { priority: 1 } // High priority for security scans
  );
};
