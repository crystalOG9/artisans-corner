import mongoose, { Document, Schema, Types } from 'mongoose';

export type OrderFulfillmentStatus = 'Processing' | 'Shipped';
export type OrderPaymentStatus = 'pending' | 'paid' | 'failed';

export interface IShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface IOrderLineItem {
  productId: Types.ObjectId;
  titleSnapshot: string;
  imageSnapshot: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface IVendorOrderGroup {
  storeId: Types.ObjectId;
  vendorId: Types.ObjectId;
  status: OrderFulfillmentStatus;
  trackingNumber?: string;
  subtotalCents: number;
  platformFeeCents: number;
  vendorNetCents: number;
  items: IOrderLineItem[];
}

export interface IOrder extends Document {
  buyerId: Types.ObjectId;
  orderNumber: string;
  shippingAddress: IShippingAddress;
  subtotalCents: number;
  platformFeeCents: number;
  totalCents: number;
  paymentStatus: OrderPaymentStatus;
  stripePaymentIntentId?: string;
  vendorOrders: IVendorOrderGroup[];
  createdAt: Date;
  updatedAt: Date;
}

const orderLineItemSchema = new Schema<IOrderLineItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    titleSnapshot: { type: String, required: true },
    imageSnapshot: { type: String, required: true },
    unitPriceCents: { type: Number, required: true, min: 100 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotalCents: { type: Number, required: true, min: 100 },
  },
  { _id: false }
);

const vendorOrderGroupSchema = new Schema<IVendorOrderGroup>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Processing', 'Shipped'],
      default: 'Processing',
    },
    trackingNumber: { type: String, trim: true, default: '' },
    subtotalCents: { type: Number, required: true, min: 100 },
    platformFeeCents: { type: Number, required: true, min: 0 },
    vendorNetCents: { type: Number, required: true, min: 0 },
    items: { type: [orderLineItemSchema], required: true },
  },
  { _id: true }
);

const orderSchema = new Schema<IOrder>(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      line1: { type: String, required: true, trim: true },
      line2: { type: String, trim: true, default: '' },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    subtotalCents: { type: Number, required: true, min: 100 },
    platformFeeCents: { type: Number, required: true, min: 0 },
    totalCents: { type: Number, required: true, min: 100 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    vendorOrders: {
      type: [vendorOrderGroupSchema],
      required: true,
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

orderSchema.index({ 'vendorOrders.vendorId': 1, paymentStatus: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);

