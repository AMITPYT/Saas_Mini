import mongoose from 'mongoose';
import { Notification, INotification } from '../models/Notification';
import { socketService } from './socket.service';
import { ApiError } from '../utils/ApiError';

interface CreateNotificationData {
  userId: string;
  type: INotification['type'];
  title: string;
  message: string;
  data?: INotification['data'];
}

interface NotificationFilters {
  isRead?: boolean;
  type?: INotification['type'];
}

class NotificationService {
  async create(data: CreateNotificationData): Promise<INotification> {
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
    });

    // Send real-time notification
    socketService.notificationSent(data.userId, {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  async createBulk(notifications: CreateNotificationData[]): Promise<INotification[]> {
    const docs = notifications.map((n) => ({
      userId: new mongoose.Types.ObjectId(n.userId),
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data || {},
    }));

    const created = await Notification.insertMany(docs);

    // Send real-time notifications
    created.forEach((notification) => {
      socketService.notificationSent(notification.userId.toString(), {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
      });
    });

    return created;
  }

  async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (typeof filters.isRead === 'boolean') {
      query.isRead = filters.isRead;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return result.modifiedCount;
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw ApiError.notFound('Notification not found');
    }
  }

  async deleteAll(userId: string): Promise<number> {
    const result = await Notification.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });
  }

  // Helper methods for common notification types
  async notifyMention(
    userId: string,
    actorId: string,
    actorName: string,
    context: { type: 'card' | 'message' | 'page'; id: string; title: string; workspaceId: string }
  ): Promise<INotification> {
    return this.create({
      userId,
      type: 'mention',
      title: 'You were mentioned',
      message: `${actorName} mentioned you in ${context.title}`,
      data: {
        actorId,
        actorName,
        workspaceId: context.workspaceId,
        ...(context.type === 'card' && { cardId: context.id }),
        ...(context.type === 'message' && { messageId: context.id }),
        ...(context.type === 'page' && { pageId: context.id }),
      },
    });
  }

  async notifyAssignment(
    userId: string,
    actorId: string,
    actorName: string,
    card: { id: string; title: string; workspaceId: string; boardId: string }
  ): Promise<INotification> {
    return this.create({
      userId,
      type: 'assignment',
      title: 'Card assigned to you',
      message: `${actorName} assigned you to "${card.title}"`,
      data: {
        actorId,
        actorName,
        workspaceId: card.workspaceId,
        boardId: card.boardId,
        cardId: card.id,
      },
    });
  }

  async notifyComment(
    userId: string,
    actorId: string,
    actorName: string,
    card: { id: string; title: string; workspaceId: string; boardId: string }
  ): Promise<INotification> {
    return this.create({
      userId,
      type: 'comment',
      title: 'New comment',
      message: `${actorName} commented on "${card.title}"`,
      data: {
        actorId,
        actorName,
        workspaceId: card.workspaceId,
        boardId: card.boardId,
        cardId: card.id,
      },
    });
  }

  async notifyInvite(
    userId: string,
    actorId: string,
    actorName: string,
    workspace: { id: string; name: string }
  ): Promise<INotification> {
    return this.create({
      userId,
      type: 'invite',
      title: 'Workspace invitation',
      message: `${actorName} invited you to "${workspace.name}"`,
      data: {
        actorId,
        actorName,
        workspaceId: workspace.id,
      },
    });
  }

  async notifyDueDate(
    userId: string,
    card: { id: string; title: string; workspaceId: string; boardId: string; dueDate: Date }
  ): Promise<INotification> {
    const isOverdue = card.dueDate < new Date();
    return this.create({
      userId,
      type: 'due_date',
      title: isOverdue ? 'Card overdue' : 'Due date approaching',
      message: isOverdue
        ? `"${card.title}" is overdue`
        : `"${card.title}" is due soon`,
      data: {
        workspaceId: card.workspaceId,
        boardId: card.boardId,
        cardId: card.id,
      },
    });
  }
}

export const notificationService = new NotificationService();
