import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
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
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['mention', 'assignment', 'comment', 'invite', 'due_date', 'card_moved', 'message', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      workspaceId: String,
      boardId: String,
      cardId: String,
      channelId: String,
      messageId: String,
      pageId: String,
      actorId: String,
      actorName: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

// TTL index - notifications expire after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
