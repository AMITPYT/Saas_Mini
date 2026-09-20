import mongoose, { Document, Schema } from 'mongoose';

export interface IChannelMember {
  user: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
}

export interface IChannel {
  name: string;
  description?: string;
  workspace: mongoose.Types.ObjectId;
  type: 'public' | 'private' | 'direct';
  members: IChannelMember[];
  createdBy: mongoose.Types.ObjectId;
  isArchived: boolean;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChannelDocument extends IChannel, Document {
  isMember(userId: string): boolean;
  isAdmin(userId: string): boolean;
}

const channelMemberSchema = new Schema<IChannelMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadAt: {
      type: Date,
    },
  },
  { _id: false }
);

const channelSchema = new Schema<IChannelDocument>(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['public', 'private', 'direct'],
      default: 'public',
    },
    members: {
      type: [channelMemberSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
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
channelSchema.index({ workspace: 1, type: 1 });
channelSchema.index({ workspace: 1, isArchived: 1 });
channelSchema.index({ 'members.user': 1 });
channelSchema.index({ name: 'text', description: 'text' });

// Methods
channelSchema.methods.isMember = function (userId: string): boolean {
  return this.members.some(
    (member: IChannelMember) => member.user.toString() === userId
  );
};

channelSchema.methods.isAdmin = function (userId: string): boolean {
  const member = this.members.find(
    (m: IChannelMember) => m.user.toString() === userId
  );
  return member?.role === 'admin';
};

export const Channel = mongoose.model<IChannelDocument>('Channel', channelSchema);
