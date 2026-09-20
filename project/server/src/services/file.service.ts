import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { File, IFileDocument } from '../models/File';
import { Workspace } from '../models/Workspace';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { queueFileScan, queueThumbnailGeneration } from '../jobs/file.job';

// Allowed MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/gzip'],
};

const ALL_ALLOWED_TYPES = Object.values(ALLOWED_TYPES).flat();

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), config.upload.path);
    const dateDir = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fullPath = path.join(uploadDir, dateDir);

    try {
      await fs.mkdir(fullPath, { recursive: true });
      cb(null, fullPath);
    } catch (error) {
      cb(error as Error, fullPath);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const safeName = `${uniqueId}${ext}`;
    cb(null, safeName);
  },
});

// File filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type ${file.mimetype} is not allowed`));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 10, // Max 10 files per request
  },
});

// File service class
class FileService {
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    options: {
      workspaceId?: string;
      resourceType?: 'card' | 'message' | 'page' | 'avatar' | 'workspace' | 'board';
      resourceId?: string;
      isPublic?: boolean;
    } = {}
  ): Promise<IFileDocument> {
    // Verify workspace access if workspaceId provided
    if (options.workspaceId) {
      const workspace = await Workspace.findById(options.workspaceId);
      if (!workspace || !workspace.isMember(userId)) {
        // Clean up uploaded file
        await this.deletePhysicalFile(file.path);
        throw ApiError.forbidden('Access denied');
      }
    }

    // Generate URL path
    const dateDir = new Date().toISOString().split('T')[0];
    const relativePath = path.join(dateDir, file.filename);
    const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    // Create file record
    const fileDoc = await File.create({
      name: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: relativePath,
      url,
      workspace: options.workspaceId,
      uploadedBy: userId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      isPublic: options.isPublic || false,
    });

    // Queue background jobs
    try {
      // Scan file for malware
      await queueFileScan(fileDoc._id.toString(), file.path);

      // Generate thumbnail for images
      if (file.mimetype.startsWith('image/')) {
        await queueThumbnailGeneration(fileDoc._id.toString(), file.path);
      }
    } catch (error) {
      logger.error('Failed to queue file processing jobs:', error);
    }

    return fileDoc;
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    userId: string,
    options: {
      workspaceId?: string;
      resourceType?: 'card' | 'message' | 'page' | 'avatar' | 'workspace' | 'board';
      resourceId?: string;
    } = {}
  ): Promise<IFileDocument[]> {
    const uploads: IFileDocument[] = [];

    for (const file of files) {
      const uploaded = await this.uploadFile(file, userId, options);
      uploads.push(uploaded);
    }

    return uploads;
  }

  async getFile(fileId: string, userId: string): Promise<IFileDocument> {
    const file = await File.findById(fileId).populate('uploadedBy', 'name email avatar');

    if (!file) {
      throw ApiError.notFound('File not found');
    }

    // Public files are accessible to anyone
    if (file.isPublic) {
      return file;
    }

    // Check workspace access
    if (file.workspace) {
      const workspace = await Workspace.findById(file.workspace);
      if (!workspace || !workspace.isMember(userId)) {
        throw ApiError.forbidden('Access denied');
      }
    } else if (file.uploadedBy.toString() !== userId) {
      throw ApiError.forbidden('Access denied');
    }

    return file;
  }

  async getWorkspaceFiles(
    workspaceId: string,
    userId: string,
    options: {
      resourceType?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ files: IFileDocument[]; total: number }> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const { resourceType, page = 1, limit = 20 } = options;

    const query: Record<string, unknown> = { workspace: workspaceId };
    if (resourceType) {
      query.resourceType = resourceType;
    }

    const [files, total] = await Promise.all([
      File.find(query)
        .populate('uploadedBy', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      File.countDocuments(query),
    ]);

    return { files, total };
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await File.findById(fileId);

    if (!file) {
      throw ApiError.notFound('File not found');
    }

    // Check permissions
    if (file.workspace) {
      const workspace = await Workspace.findById(file.workspace);
      const role = workspace?.getMemberRole(userId);
      if (
        file.uploadedBy.toString() !== userId &&
        role !== 'owner' &&
        role !== 'admin'
      ) {
        throw ApiError.forbidden('Not authorized to delete this file');
      }
    } else if (file.uploadedBy.toString() !== userId) {
      throw ApiError.forbidden('Not authorized to delete this file');
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), config.upload.path, file.path);
    await this.deletePhysicalFile(filePath);

    // Delete thumbnail if exists
    if (file.metadata?.thumbnailPath) {
      await this.deletePhysicalFile(file.metadata.thumbnailPath as string);
    }

    // Delete database record
    await File.findByIdAndDelete(fileId);
  }

  async attachToResource(
    fileId: string,
    resourceType: 'card' | 'message' | 'page',
    resourceId: string,
    userId: string
  ): Promise<IFileDocument> {
    const file = await File.findById(fileId);

    if (!file) {
      throw ApiError.notFound('File not found');
    }

    if (file.uploadedBy.toString() !== userId) {
      throw ApiError.forbidden('Not authorized');
    }

    file.resourceType = resourceType;
    file.resourceId = resourceId as any;
    await file.save();

    return file;
  }

  private async deletePhysicalFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.error(`Failed to delete file ${filePath}:`, error);
    }
  }

  // Helper to get file type category
  getFileCategory(mimeType: string): string {
    for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
      if (types.includes(mimeType)) {
        return category;
      }
    }
    return 'other';
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileService = new FileService();
