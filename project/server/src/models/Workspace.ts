import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspaceMember {
  user: mongoose.Types.ObjectId;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface IWorkspace {
  name: string;
  description?: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  logo?: string;
  settings: {
    isPublic: boolean;
    allowMemberInvites: boolean;
  };
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceDocument extends IWorkspace, Document {
  isMember(userId: string): boolean;
  getMemberRole(userId: string): string | null;
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const workspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: {
      type: [workspaceMemberSchema],
      default: [],
    },
    logo: {
      type: String,
    },
    settings: {
      isPublic: {
        type: Boolean,
        default: false,
      },
      allowMemberInvites: {
        type: Boolean,
        default: true,
      },
    },
    isArchived: {
      type: Boolean,
      default: false,
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
workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ slug: 1 }, { unique: true });
workspaceSchema.index({ name: 'text', description: 'text' });

// Methods
workspaceSchema.methods.isMember = function (userId: string): boolean {
  if (this.owner.toString() === userId) return true;
  return this.members.some(
    (member: IWorkspaceMember) => member.user.toString() === userId
  );
};

workspaceSchema.methods.getMemberRole = function (userId: string): string | null {
  if (this.owner.toString() === userId) return 'owner';
  const member = this.members.find(
    (m: IWorkspaceMember) => m.user.toString() === userId
  );
  return member ? member.role : null;
};

// Generate slug before validation so required slug checks pass on create
workspaceSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now().toString(36);
  }
  next();
});

export const Workspace = mongoose.model<IWorkspaceDocument>('Workspace', workspaceSchema);
