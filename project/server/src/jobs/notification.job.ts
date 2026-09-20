import { Job, Worker } from 'bullmq';
import { config } from '../config';
import { logger } from '../utils/logger';
import { QUEUE_NAMES } from '../config/queue';
import { cacheService } from '../services/cache.service';

export type NotificationType =
  | 'card_assigned'
  | 'card_due_soon'
  | 'card_overdue'
  | 'card_comment'
  | 'card_mention'
  | 'message_mention'
  | 'channel_invite'
  | 'workspace_invite'
  | 'board_shared';

interface NotificationJobData {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  data: {
    workspaceId?: string;
    boardId?: string;
    cardId?: string;
    channelId?: string;
    messageId?: string;
    senderId?: string;
  };
  sendEmail?: boolean;
  sendPush?: boolean;
}

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

// Store notification (in production, save to database)
const storeNotification = async (notification: NotificationJobData): Promise<void> => {
  // In production, save to a Notification model in MongoDB
  logger.info(`[NOTIFICATION] Storing notification for user ${notification.userId}`);
  logger.info(`[NOTIFICATION] Type: ${notification.type}, Title: ${notification.title}`);
};

// Send real-time notification via Socket.io
const sendRealtimeNotification = async (
  userId: string,
  notification: NotificationJobData
): Promise<void> => {
  // Get socket.io instance and emit to user
  const isOnline = await cacheService.isUserOnline(userId);

  if (isOnline) {
    // In production, emit via socket.io
    logger.info(`[NOTIFICATION] Sending realtime notification to user ${userId}`);

    // This would be called from the socket service:
    // io.to(`user:${userId}`).emit('notification', notification);
  }
};

// Process notification jobs
const processNotificationJob = async (job: Job<NotificationJobData>): Promise<void> => {
  const notification = job.data;

  // Store notification
  await storeNotification(notification);

  // Send real-time notification
  await sendRealtimeNotification(notification.userId, notification);

  // Optionally send email notification
  if (notification.sendEmail) {
    const { queueNotificationEmail } = await import('./email.job');
    // In production, fetch user email from database
    // await queueNotificationEmail(user.email, user.name, notification.title, notification.message);
  }

  // Optionally send push notification (for mobile apps)
  if (notification.sendPush) {
    // Integrate with services like:
    // - Firebase Cloud Messaging (FCM)
    // - Apple Push Notification Service (APNS)
    // - OneSignal
    logger.info(`[NOTIFICATION] Push notification would be sent to user ${notification.userId}`);
  }
};

// Create notification worker
export const createNotificationWorker = (): Worker => {
  const worker = new Worker(QUEUE_NAMES.NOTIFICATION, processNotificationJob, {
    connection,
    concurrency: 10,
  });

  worker.on('completed', (job) => {
    logger.debug(`Notification job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Notification job ${job?.id} failed:`, err);
  });

  return worker;
};

// Helper functions to queue notifications
export const notifyCardAssigned = async (
  userId: string,
  cardTitle: string,
  boardName: string,
  assignedBy: string,
  data: { workspaceId: string; boardId: string; cardId: string; senderId: string }
): Promise<void> => {
  const { notificationQueue, addJob } = await import('../config/queue');
  await addJob(notificationQueue, 'card-assigned', {
    type: 'card_assigned',
    userId,
    title: 'Card Assigned',
    message: `${assignedBy} assigned you to "${cardTitle}" in ${boardName}`,
    data,
    sendEmail: true,
  });
};

export const notifyCardDueSoon = async (
  userId: string,
  cardTitle: string,
  dueDate: string,
  data: { workspaceId: string; boardId: string; cardId: string }
): Promise<void> => {
  const { notificationQueue, addJob } = await import('../config/queue');
  await addJob(notificationQueue, 'card-due-soon', {
    type: 'card_due_soon',
    userId,
    title: 'Card Due Soon',
    message: `"${cardTitle}" is due on ${dueDate}`,
    data,
    sendEmail: true,
  });
};

export const notifyCardComment = async (
  userId: string,
  cardTitle: string,
  commenterName: string,
  commentPreview: string,
  data: { workspaceId: string; boardId: string; cardId: string; senderId: string }
): Promise<void> => {
  const { notificationQueue, addJob } = await import('../config/queue');
  await addJob(notificationQueue, 'card-comment', {
    type: 'card_comment',
    userId,
    title: 'New Comment',
    message: `${commenterName} commented on "${cardTitle}": ${commentPreview}`,
    data,
  });
};

export const notifyMention = async (
  userId: string,
  mentionedBy: string,
  context: string,
  type: 'card_mention' | 'message_mention',
  data: { workspaceId?: string; boardId?: string; cardId?: string; channelId?: string; messageId?: string; senderId: string }
): Promise<void> => {
  const { notificationQueue, addJob } = await import('../config/queue');
  await addJob(notificationQueue, 'mention', {
    type,
    userId,
    title: 'You were mentioned',
    message: `${mentionedBy} mentioned you: ${context}`,
    data,
    sendEmail: true,
  });
};

export const notifyChannelInvite = async (
  userId: string,
  channelName: string,
  invitedBy: string,
  data: { workspaceId: string; channelId: string; senderId: string }
): Promise<void> => {
  const { notificationQueue, addJob } = await import('../config/queue');
  await addJob(notificationQueue, 'channel-invite', {
    type: 'channel_invite',
    userId,
    title: 'Channel Invitation',
    message: `${invitedBy} added you to #${channelName}`,
    data,
  });
};

export const notifyWorkspaceInvite = async (
  userId: string,
  workspaceName: string,
  invitedBy: string,
  data: { workspaceId: string; senderId: string }
): Promise<void> => {
  const { notificationQueue, addJob } = await import('../config/queue');
  await addJob(notificationQueue, 'workspace-invite', {
    type: 'workspace_invite',
    userId,
    title: 'Workspace Invitation',
    message: `${invitedBy} invited you to join ${workspaceName}`,
    data,
    sendEmail: true,
  });
};
