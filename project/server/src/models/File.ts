import mongoose, { Document, Schema } from 'mongoose';

export interface IFile {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  workspace?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  resourceType?: 'card' | 'message' | 'page' | 'avatar' | 'workspace' | 'board';
  resourceId?: mongoose.Types.ObjectId;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFileDocument extends IFile, Document {}

const fileSchema = new Schema<IFileDocument>(
  {
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['card', 'message', 'page', 'avatar', 'workspace', 'board'],
    },
    resourceId: {
      type: Schema.Types.ObjectId,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
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
fileSchema.index({ workspace: 1, uploadedBy: 1 });
fileSchema.index({ resourceType: 1, resourceId: 1 });
fileSchema.index({ uploadedBy: 1, createdAt: -1 });

export const File = mongoose.model<IFileDocument>('File', fileSchema);
