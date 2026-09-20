import { Request, Response } from 'express';
import { pageService } from '../services/page.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const createPage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = await pageService.createPage(req.body, userId);
  return ApiResponse.created(res, { page }, 'Page created successfully');
});

export const getPage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const page = await pageService.getPage(id, userId);
  return ApiResponse.success(res, { page }, 'Page retrieved successfully');
});

export const getWorkspacePages = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.userId;
  const { parentId, favorites } = req.query;

  const pages = await pageService.getWorkspacePages(workspaceId, userId, {
    parentId: parentId as string,
    favorites: favorites === 'true',
  });

  return ApiResponse.success(res, { pages }, 'Pages retrieved successfully');
});

export const updatePage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const page = await pageService.updatePage(id, req.body, userId);
  return ApiResponse.success(res, { page }, 'Page updated successfully');
});

export const movePage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const page = await pageService.movePage(id, req.body, userId);
  return ApiResponse.success(res, { page }, 'Page moved successfully');
});

export const deletePage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  await pageService.deletePage(id, userId);
  return ApiResponse.success(res, null, 'Page deleted successfully');
});

export const duplicatePage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { includeChildren } = req.body;
  const userId = req.user!.userId;
  const page = await pageService.duplicatePage(id, includeChildren, userId);
  return ApiResponse.created(res, { page }, 'Page duplicated successfully');
});

export const searchPages = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { q } = req.query;
  const userId = req.user!.userId;

  if (!q || typeof q !== 'string') {
    return ApiResponse.success(res, { pages: [] }, 'No search query provided');
  }

  const pages = await pageService.searchPages(workspaceId, q, userId);
  return ApiResponse.success(res, { pages }, 'Search completed successfully');
});
