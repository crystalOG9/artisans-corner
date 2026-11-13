import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  productId: Types.ObjectId;
  buyerId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const cleaned: Record<string, unknown> = { ...ret };
        delete cleaned.__v;
        return cleaned;
      },
    },
  }
);

// Prevent duplicate reviews by the same buyer for the same product
reviewSchema.index({ productId: 1, buyerId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);

