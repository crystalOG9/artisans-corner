import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStore extends Document {
  ownerId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  logoPublicId: string;
  location: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    logoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    logoPublicId: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
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

export const Store = mongoose.model<IStore>('Store', storeSchema);

