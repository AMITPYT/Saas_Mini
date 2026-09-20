import { Request, Response } from 'express';
import { fileService, upload } from '../services/file.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const uploadSingle = [
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const userId = req.user!.userId;
    const { workspaceId, resourceType, resourceId, isPublic } = req.body;

    const file = await fileService.uploadFile(req.file, userId, {
      workspaceId,
      resourceType,
      resourceId,
      isPublic: isPublic === 'true',
    });

    return ApiResponse.created(res, { file }, 'File uploaded successfully');
  }),
];

export const uploadMultiple = [
  upload.array('files', 10),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw ApiError.badRequest('No files uploaded');
    }

    const userId = req.user!.userId;
    const { workspaceId, resourceType, resourceId } = req.body;

    const files = await fileService.uploadMultiple(req.files, userId, {
      workspaceId,
      resourceType,
      resourceId,
    });

    return ApiResponse.created(res, { files }, 'Files uploaded successfully');
  }),
];

export const getFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const file = await fileService.getFile(id, userId);

  return ApiResponse.success(res, { file }, 'File retrieved successfully');
});

export const getWorkspaceFiles = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.userId;
  const { resourceType, page, limit } = req.query;

  const result = await fileService.getWorkspaceFiles(workspaceId, userId, {
    resourceType: resourceType as string,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });

  return ApiResponse.paginated(
    res,
    result.files,
    {
      page: parseInt((page as string) || '1', 10),
      limit: parseInt((limit as string) || '20', 10),
      total: result.total,
    },
    'Files retrieved successfully'
  );
});

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  await fileService.deleteFile(id, userId);

  return ApiResponse.success(res, null, 'File deleted successfully');
});

export const attachFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { resourceType, resourceId } = req.body;
  const userId = req.user!.userId;

  const file = await fileService.attachToResource(id, resourceType, resourceId, userId);

  return ApiResponse.success(res, { file }, 'File attached successfully');
});
