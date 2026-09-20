import { Request, Response } from 'express';
import { searchService } from '../services/search.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { q, types, page, limit } = req.query;
  const userId = req.user!.userId;

  if (!q || typeof q !== 'string') {
    throw ApiError.badRequest('Search query is required');
  }

  const searchTypes = types
    ? (types as string).split(',').filter((t) =>
        ['card', 'page', 'message', 'channel', 'board'].includes(t)
      )
    : undefined;

  const results = await searchService.search(workspaceId, q, userId, {
    types: searchTypes as any,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });

  return ApiResponse.success(res, results, 'Search completed successfully');
});

export const quickSearch = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { q } = req.query;
  const userId = req.user!.userId;

  if (!q || typeof q !== 'string') {
    return ApiResponse.success(res, { results: [] }, 'No query provided');
  }

  const results = await searchService.quickSearch(workspaceId, q, userId);

  return ApiResponse.success(res, { results }, 'Quick search completed');
});

export const getRecentItems = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { limit } = req.query;
  const userId = req.user!.userId;

  const results = await searchService.getRecentItems(
    workspaceId,
    userId,
    limit ? parseInt(limit as string, 10) : 10
  );

  return ApiResponse.success(res, { results }, 'Recent items retrieved successfully');
});
