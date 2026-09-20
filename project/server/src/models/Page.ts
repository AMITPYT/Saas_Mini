import mongoose, { Document, Schema } from 'mongoose';

export interface IPage {
  title: string;
  content: string; // JSON content from editor (TipTap/Slate)
  workspace: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId; // For nested pages
  icon?: string;
  cover?: string;
  isPublished: boolean;
  publishedAt?: Date;
  isArchived: boolean;
  isFavorite: boolean;
  position: number;
  createdBy: mongoose.Types.ObjectId;
  lastEditedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPageDocument extends IPage, Document {}

const pageSchema = new Schema<IPageDocument>(
  {
    title: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters'],
      default: 'Untitled',
    },
    content: {
      type: String, // Stored as JSON string
      default: '{}',
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Page',
      index: true,
    },
    icon: {
      type: String,
    },
    cover: {
      type: String,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    position: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
pageSchema.index({ workspace: 1, parent: 1, position: 1 });
pageSchema.index({ workspace: 1, isArchived: 1 });
pageSchema.index({ workspace: 1, isFavorite: 1 });
pageSchema.index({ createdBy: 1 });
pageSchema.index({ title: 'text', content: 'text' });

// Virtual for child pages
pageSchema.virtual('children', {
  ref: 'Page',
  localField: '_id',
  foreignField: 'parent',
  options: { sort: { position: 1 } },
});

// Pre-save hook for publishedAt
pageSchema.pre('save', function (next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export const Page = mongoose.model<IPageDocument>('Page', pageSchema);
