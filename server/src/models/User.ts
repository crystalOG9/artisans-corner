import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'buyer' | 'vendor' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    roles: {
      type: [String],
      enum: ['buyer', 'vendor', 'admin'],
      default: ['buyer'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const cleaned: Record<string, unknown> = { ...ret };
        delete cleaned.passwordHash;
        delete cleaned.__v;
        return cleaned;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', userSchema);

