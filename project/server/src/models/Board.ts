import mongoose, { Document, Schema } from 'mongoose';

export interface ILabel {
  id: string;
  name: string;
  color: string;
}

export interface IBoard {
  name: string;
  description?: string;
  workspace: mongoose.Types.ObjectId;
  background: {
    type: 'color' | 'image';
    value: string;
  };
  labels: ILabel[];
  isArchived: boolean;
  isFavorite: boolean;
  createdBy: mongoose.Types.ObjectId;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBoardDocument extends IBoard, Document {}

const labelSchema = new Schema<ILabel>(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const boardSchema = new Schema<IBoardDocument>(
  {
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    background: {
      type: {
        type: String,
        enum: ['color', 'image'],
        default: 'color',
      },
      value: {
        type: String,
        default: '#0079bf',
      },
    },
    labels: {
      type: [labelSchema],
      default: [
        { id: 'label-1', name: 'Bug', color: '#ef4444' },
        { id: 'label-2', name: 'Feature', color: '#22c55e' },
        { id: 'label-3', name: 'Enhancement', color: '#3b82f6' },
        { id: 'label-4', name: 'Documentation', color: '#a855f7' },
        { id: 'label-5', name: 'Urgent', color: '#f97316' },
      ],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    position: {
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
boardSchema.index({ workspace: 1, position: 1 });
boardSchema.index({ workspace: 1, isArchived: 1 });
boardSchema.index({ createdBy: 1 });
boardSchema.index({ name: 'text', description: 'text' });

// Virtual for lists
boardSchema.virtual('lists', {
  ref: 'List',
  localField: '_id',
  foreignField: 'board',
  options: { sort: { position: 1 } },
});

export const Board = mongoose.model<IBoardDocument>('Board', boardSchema);
