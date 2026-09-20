import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction =
  | 'user.register'
  | 'user.login'
  | 'user.logout'
  | 'user.password_reset_request'
  | 'user.password_reset'
  | 'user.profile_update'
  | 'user.delete'
  | 'workspace.create'
  | 'workspace.update'
  | 'workspace.delete'
  | 'workspace.member_add'
  | 'workspace.member_remove'
  | 'board.create'
  | 'board.update'
  | 'board.delete'
  | 'board.archive'
  | 'list.create'
  | 'list.update'
  | 'list.delete'
  | 'card.create'
  | 'card.update'
  | 'card.delete'
  | 'card.move'
  | 'card.archive'
  | 'channel.create'
  | 'channel.update'
  | 'channel.delete'
  | 'message.create'
  | 'message.update'
  | 'message.delete'
  | 'page.create'
  | 'page.update'
  | 'page.delete'
  | 'file.upload'
  | 'file.delete';

export interface IAuditLog {
  user: mongoose.Types.ObjectId;
  action: AuditAction;
  resource: string;
  resourceId?: mongoose.Types.ObjectId;
  workspace?: mongoose.Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ workspace: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// TTL index - keep audit logs for 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);
