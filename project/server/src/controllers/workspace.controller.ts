import { Request, Response } from 'express';
import { workspaceService } from '../services/workspace.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const workspace = await workspaceService.create(req.body, userId);
  return ApiResponse.created(res, { workspace }, 'Workspace created successfully');
});

export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const workspace = await workspaceService.getById(id, userId);
  return ApiResponse.success(res, { workspace }, 'Workspace retrieved successfully');
});

export const getUserWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const workspaces = await workspaceService.getUserWorkspaces(userId);
  return ApiResponse.success(res, { workspaces }, 'Workspaces retrieved successfully');
});

export const updateWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const workspace = await workspaceService.update(id, req.body, userId);
  return ApiResponse.success(res, { workspace }, 'Workspace updated successfully');
});

export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  await workspaceService.delete(id, userId);
  return ApiResponse.success(res, null, 'Workspace deleted successfully');
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const workspace = await workspaceService.addMember(id, req.body, userId);
  return ApiResponse.success(res, { workspace }, 'Member added successfully');
});

export const updateMember = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId: memberId } = req.params;
  const userId = req.user!.userId;
  const { role } = req.body;
  const workspace = await workspaceService.updateMember(id, memberId, role, userId);
  return ApiResponse.success(res, { workspace }, 'Member role updated successfully');
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId: memberId } = req.params;
  const userId = req.user!.userId;
  await workspaceService.removeMember(id, memberId, userId);
  return ApiResponse.success(res, null, 'Member removed successfully');
});

export const getWorkspaceStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const stats = await workspaceService.getWorkspaceStats(id, userId);
  return ApiResponse.success(res, { stats }, 'Statistics retrieved successfully');
});
