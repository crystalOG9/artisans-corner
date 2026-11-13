import mongoose, { Document, Schema, Types } from 'mongoose';

export const PRODUCT_CATEGORIES = [
  'Ceramics & Pottery',
  'Textiles & Weaving',
  'Woodwork',
  'Jewelry & Metalsmithing',
  'Leathercraft',
  'Home & Botanical',
  'Paper & Printmaking',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface IProductImage {
  url: string;
  publicId: string;
}

export interface IProduct extends Document {
  storeId: Types.ObjectId;
  vendorId: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  materials: string;
  category: ProductCategory;
  priceCents: number;
  stock: number;
  images: IProductImage[];
  ratingAvg: number;
  ratingCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
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
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
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
      minlength: 15,
      maxlength: 2500,
    },
    materials: {
      type: String,
      trim: true,
      maxlength: 250,
      default: '',
    },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      required: true,
      index: true,
    },
    priceCents: {
      type: Number,
      required: true,
      min: 100, // minimum $1.00
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    images: {
      type: [productImageSchema],
      validate: {
        validator: (imgs: IProductImage[]) => imgs.length >= 1 && imgs.length <= 5,
        message: 'A product must include between 1 and 5 images.',
      },
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
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

productSchema.index({ title: 'text', description: 'text', materials: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);

