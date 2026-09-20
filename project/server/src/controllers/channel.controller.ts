import { Request, Response } from 'express';
import { channelService } from '../services/channel.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// Channel operations
export const createChannel = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const channel = await channelService.createChannel(req.body, userId);
  return ApiResponse.created(res, { channel }, 'Channel created successfully');
});

export const createDirectChannel = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { workspaceId, userId: targetUserId } = req.body;
  const channel = await channelService.createDirectChannel(workspaceId, targetUserId, userId);
  return ApiResponse.created(res, { channel }, 'Direct channel created successfully');
});

export const getChannel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const channel = await channelService.getChannel(id, userId);
  return ApiResponse.success(res, { channel }, 'Channel retrieved successfully');
});

export const getWorkspaceChannels = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.userId;
  const channels = await channelService.getWorkspaceChannels(workspaceId, userId);
  return ApiResponse.success(res, { channels }, 'Channels retrieved successfully');
});

export const updateChannel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const channel = await channelService.updateChannel(id, req.body, userId);
  return ApiResponse.success(res, { channel }, 'Channel updated successfully');
});

export const deleteChannel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  await channelService.deleteChannel(id, userId);
  return ApiResponse.success(res, null, 'Channel deleted successfully');
});

export const addChannelMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId: targetUserId, role } = req.body;
  const userId = req.user!.userId;
  const channel = await channelService.addMember(id, targetUserId, role, userId);
  return ApiResponse.success(res, { channel }, 'Member added successfully');
});

export const removeChannelMember = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId: targetUserId } = req.params;
  const userId = req.user!.userId;
  await channelService.removeMember(id, targetUserId, userId);
  return ApiResponse.success(res, null, 'Member removed successfully');
});

// Message operations
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const message = await channelService.createMessage(req.body, userId);
  return ApiResponse.created(res, { message }, 'Message sent successfully');
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { channelId } = req.params;
  const userId = req.user!.userId;
  const { limit, before, after } = req.query;

  const result = await channelService.getMessages(channelId, userId, {
    limit: limit ? parseInt(limit as string, 10) : undefined,
    before: before as string,
    after: after as string,
  });

  return ApiResponse.success(res, result, 'Messages retrieved successfully');
});

export const getThreadMessages = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user!.userId;
  const messages = await channelService.getThreadMessages(messageId, userId);
  return ApiResponse.success(res, { messages }, 'Thread messages retrieved successfully');
});

export const updateMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user!.userId;
  const message = await channelService.updateMessage(id, content, userId);
  return ApiResponse.success(res, { message }, 'Message updated successfully');
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  await channelService.deleteMessage(id, userId);
  return ApiResponse.success(res, null, 'Message deleted successfully');
});

export const addReaction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { emoji } = req.body;
  const userId = req.user!.userId;
  const message = await channelService.addReaction(id, emoji, userId);
  return ApiResponse.success(res, { message }, 'Reaction added successfully');
});

export const removeReaction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { emoji } = req.body;
  const userId = req.user!.userId;
  const message = await channelService.removeReaction(id, emoji, userId);
  return ApiResponse.success(res, { message }, 'Reaction removed successfully');
});
