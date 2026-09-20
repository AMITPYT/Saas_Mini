import { Request, Response } from 'express';
import { cardService } from '../services/card.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const createCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const card = await cardService.createCard(req.body, userId);
  return ApiResponse.created(res, { card }, 'Card created successfully');
});

export const getCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const card = await cardService.getCard(id, userId);
  return ApiResponse.success(res, { card }, 'Card retrieved successfully');
});

export const updateCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const card = await cardService.updateCard(id, req.body, userId);
  return ApiResponse.success(res, { card }, 'Card updated successfully');
});

export const moveCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const card = await cardService.moveCard(id, req.body, userId);
  return ApiResponse.success(res, { card }, 'Card moved successfully');
});

export const deleteCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  await cardService.deleteCard(id, userId);
  return ApiResponse.success(res, null, 'Card deleted successfully');
});

// Comment operations
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const card = await cardService.addComment(id, req.body, userId);
  return ApiResponse.created(res, { card }, 'Comment added successfully');
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { id, commentId } = req.params;
  const { content } = req.body;
  const userId = req.user!.userId;
  const card = await cardService.updateComment(id, commentId, content, userId);
  return ApiResponse.success(res, { card }, 'Comment updated successfully');
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { id, commentId } = req.params;
  const userId = req.user!.userId;
  const card = await cardService.deleteComment(id, commentId, userId);
  return ApiResponse.success(res, { card }, 'Comment deleted successfully');
});

// Checklist operations
export const addChecklist = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const card = await cardService.addChecklist(id, req.body, userId);
  return ApiResponse.created(res, { card }, 'Checklist added successfully');
});

export const addChecklistItem = asyncHandler(async (req: Request, res: Response) => {
  const { id, checklistId } = req.params;
  const { text } = req.body;
  const userId = req.user!.userId;
  const card = await cardService.addChecklistItem(id, checklistId, text, userId);
  return ApiResponse.created(res, { card }, 'Checklist item added successfully');
});

export const updateChecklistItem = asyncHandler(async (req: Request, res: Response) => {
  const { id, checklistId, itemId } = req.params;
  const userId = req.user!.userId;
  const card = await cardService.updateChecklistItem(id, checklistId, itemId, req.body, userId);
  return ApiResponse.success(res, { card }, 'Checklist item updated successfully');
});

export const deleteChecklist = asyncHandler(async (req: Request, res: Response) => {
  const { id, checklistId } = req.params;
  const userId = req.user!.userId;
  const card = await cardService.deleteChecklist(id, checklistId, userId);
  return ApiResponse.success(res, { card }, 'Checklist deleted successfully');
});
