import mongoose, { Document, Schema } from 'mongoose';

export interface IReaction {
  emoji: string;
  users: mongoose.Types.ObjectId[];
}

export interface IMessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface IMessage {
  content: string;
  channel: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  parentMessage?: mongoose.Types.ObjectId; // For threads
  reactions: IReaction[];
  attachments: IMessageAttachment[];
  mentions: mongoose.Types.ObjectId[];
  isEdited: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

const reactionSchema = new Schema<IReaction>(
  {
    emoji: {
      type: String,
      required: true,
    },
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  { _id: false }
);

const messageAttachmentSchema = new Schema<IMessageAttachment>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessageDocument>(
  {
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [10000, 'Message cannot exceed 10000 characters'],
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      index: true,
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    attachments: {
      type: [messageAttachmentSchema],
      default: [],
    },
    mentions: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ parentMessage: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isPinned: 1, channel: 1 });
messageSchema.index({ content: 'text' });

// Virtual for thread replies
messageSchema.virtual('replies', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'parentMessage',
  options: { sort: { createdAt: 1 } },
});

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
