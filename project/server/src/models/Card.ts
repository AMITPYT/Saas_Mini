import mongoose, { Document, Schema } from 'mongoose';

export interface IChecklist {
  id: string;
  title: string;
  items: {
    id: string;
    text: string;
    isCompleted: boolean;
  }[];
}

export interface IComment {
  id: string;
  content: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ICard {
  title: string;
  description?: string;
  list: mongoose.Types.ObjectId;
  board: mongoose.Types.ObjectId;
  position: number;
  assignees: mongoose.Types.ObjectId[];
  labels: string[]; // Label IDs from board
  dueDate?: Date;
  startDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  checklists: IChecklist[];
  attachments: IAttachment[];
  comments: IComment[];
  cover?: {
    type: 'color' | 'image';
    value: string;
  };
  isArchived: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICardDocument extends ICard, Document {}

const checklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const checklistSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    items: [checklistItemSchema],
  },
  { _id: false }
);

const attachmentSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const commentSchema = new Schema(
  {
    id: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cardSchema = new Schema<ICardDocument>(
  {
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [500, 'Title cannot exceed 500 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    list: {
      type: Schema.Types.ObjectId,
      ref: 'List',
      required: true,
      index: true,
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
    assignees: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    labels: [{
      type: String,
    }],
    dueDate: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    checklists: {
      type: [checklistSchema],
      default: [],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    cover: {
      type: {
        type: String,
        enum: ['color', 'image'],
      },
      value: String,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
cardSchema.index({ list: 1, position: 1 });
cardSchema.index({ board: 1, isArchived: 1 });
cardSchema.index({ assignees: 1 });
cardSchema.index({ dueDate: 1 });
cardSchema.index({ labels: 1 });
cardSchema.index({ title: 'text', description: 'text' });

// Pre-save hook to update completedAt
cardSchema.pre('save', function (next) {
  if (this.isModified('isCompleted')) {
    this.completedAt = this.isCompleted ? new Date() : undefined;
  }
  next();
});

export const Card = mongoose.model<ICardDocument>('Card', cardSchema);
