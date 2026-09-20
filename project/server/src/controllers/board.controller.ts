import { Request, Response } from 'express';
import { boardService } from '../services/board.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// Board operations
export const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const board = await boardService.createBoard(req.body, userId);
  return ApiResponse.created(res, { board }, 'Board created successfully');
});

export const getBoard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const board = await boardService.getBoard(id, userId);
  return ApiResponse.success(res, { board }, 'Board retrieved successfully');
});

export const getWorkspaceBoards = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.userId;
  const boards = await boardService.getWorkspaceBoards(workspaceId, userId);
  return ApiResponse.success(res, { boards }, 'Boards retrieved successfully');
});

export const updateBoard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const board = await boardService.updateBoard(id, req.body, userId);
  return ApiResponse.success(res, { board }, 'Board updated successfully');
});

export const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  await boardService.deleteBoard(id, userId);
  return ApiResponse.success(res, null, 'Board deleted successfully');
});

// List operations
export const createList = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { boardId } = req.params;
  const list = await boardService.createList({ ...req.body, boardId }, userId);
  return ApiResponse.created(res, { list }, 'List created successfully');
});

export const updateList = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const list = await boardService.updateList(id, req.body, userId);
  return ApiResponse.success(res, { list }, 'List updated successfully');
});

export const deleteList = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  await boardService.deleteList(id, userId);
  return ApiResponse.success(res, null, 'List deleted successfully');
});

export const moveList = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { position } = req.body;
  const userId = req.user!.userId;
  const list = await boardService.moveList(id, position, userId);
  return ApiResponse.success(res, { list }, 'List moved successfully');
});

export const reorderLists = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;
  const { listIds } = req.body;
  const userId = req.user!.userId;
  await boardService.reorderLists(boardId, listIds, userId);
  return ApiResponse.success(res, null, 'Lists reordered successfully');
});
