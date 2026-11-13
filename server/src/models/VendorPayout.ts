import mongoose, { Document, Schema, Types } from 'mongoose';

export type PayoutStatus = 'recorded' | 'settled_simulated';

export interface IVendorPayout extends Document {
  orderId: Types.ObjectId;
  orderNumber: string;
  storeId: Types.ObjectId;
  vendorId: Types.ObjectId;
  grossCents: number;
  commissionCents: number;
  netAmountCents: number;
  status: PayoutStatus;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vendorPayoutSchema = new Schema<IVendorPayout>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    grossCents: { type: Number, required: true, min: 100 },
    commissionCents: { type: Number, required: true, min: 0 },
    netAmountCents: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['recorded', 'settled_simulated'],
      default: 'recorded',
    },
    settledAt: { type: Date },
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

vendorPayoutSchema.index({ orderId: 1, storeId: 1 }, { unique: true });

export const VendorPayout = mongoose.model<IVendorPayout>(
  'VendorPayout',
  vendorPayoutSchema
);

