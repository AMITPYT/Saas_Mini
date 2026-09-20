import mongoose, { Document, Schema } from 'mongoose';

export interface IList {
  name: string;
  board: mongoose.Types.ObjectId;
  position: number;
  isArchived: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IListDocument extends IList, Document {}

const listSchema = new Schema<IListDocument>(
  {
    name: {
      type: String,
      required: [true, 'List name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
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
listSchema.index({ board: 1, position: 1 });
listSchema.index({ board: 1, isArchived: 1 });

// Virtual for cards
listSchema.virtual('cards', {
  ref: 'Card',
  localField: '_id',
  foreignField: 'list',
  options: { sort: { position: 1 } },
});

export const List = mongoose.model<IListDocument>('List', listSchema);
