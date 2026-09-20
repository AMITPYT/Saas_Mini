import { api, ApiResponse } from './api';

export interface Notification {
  _id: string;
  type: 'mention' | 'assignment' | 'comment' | 'invite' | 'due_date' | 'card_moved' | 'message' | 'system';
  title: string;
  message: string;
  data: {
    workspaceId?: string;
    boardId?: string;
    cardId?: string;
    channelId?: string;
    messageId?: string;
    pageId?: string;
    actorId?: string;
    actorName?: string;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export const notificationService = {
  getAll: (params?: { isRead?: boolean; type?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<NotificationResponse>>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.post<ApiResponse<{ notification: Notification }>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.post<ApiResponse<{ markedCount: number }>>('/notifications/mark-all-read'),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),

  deleteAll: () =>
    api.delete('/notifications/delete-all'),
};
