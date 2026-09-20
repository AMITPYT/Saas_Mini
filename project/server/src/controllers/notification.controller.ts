import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { isRead, type, page, limit } = req.query;

  const result = await notificationService.getUserNotifications(
    userId,
    {
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type: type as any,
    },
    page ? parseInt(page as string, 10) : 1,
    limit ? parseInt(limit as string, 10) : 20
  );

  return ApiResponse.paginated(
    res,
    result.notifications,
    {
      page: parseInt((page as string) || '1', 10),
      limit: parseInt((limit as string) || '20', 10),
      total: result.total,
    },
    'Notifications retrieved successfully',
    { unreadCount: result.unreadCount }
  );
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const count = await notificationService.getUnreadCount(userId);

  return ApiResponse.success(res, { unreadCount: count }, 'Unread count retrieved');
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const notification = await notificationService.markAsRead(id, userId);

  return ApiResponse.success(res, { notification }, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const count = await notificationService.markAllAsRead(userId);

  return ApiResponse.success(res, { markedCount: count }, 'All notifications marked as read');
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  await notificationService.delete(id, userId);

  return ApiResponse.success(res, null, 'Notification deleted');
});

export const deleteAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const count = await notificationService.deleteAll(userId);

  return ApiResponse.success(res, { deletedCount: count }, 'All notifications deleted');
});
