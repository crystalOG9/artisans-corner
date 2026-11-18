import { FilterQuery, SortOrder } from 'mongoose';
import { IProduct, Product, ProductCategory } from '../models/Product';
import { Store } from '../models/Store';
import { AppError } from '../utils/AppError';
import { toSlug } from '../utils/slugify';
import { deleteCloudAsset, uploadImageBuffer } from './uploadService';

export interface MarketplaceQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  storeId?: string;
  inStock?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'top_rated';
}

export async function createProductForVendor(
  vendorId: string,
  input: {
    title: string;
    description: string;
    materials?: string;
    category: ProductCategory;
    price: number;
    stock: number;
  },
  files: Express.Multer.File[] | undefined
) {
  if (!files || files.length === 0) {
    throw new AppError('Please upload at least 1 product photograph.', 400);
  }

  const store = await Store.findOne({ ownerId: vendorId, isActive: true });
  if (!store) {
    throw new AppError(
      'An active store profile is required before listing products.',
      403
    );
  }

  const uploadedImages = await Promise.all(
    files.map((file) => uploadImageBuffer(file.buffer, 'artisans-corner/products'))
  );

  const priceCents = Math.round(input.price * 100);

  const product = await Product.create({
    storeId: store._id,
    vendorId,
    title: input.title,
    slug: toSlug(input.title),
    description: input.description,
    materials: input.materials || '',
    category: input.category,
    priceCents,
    stock: input.stock,
    images: uploadedImages,
  });

  return product.toJSON();
}

export async function listPublicProducts(query: MarketplaceQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(48, Math.max(1, query.limit || 12));
  const skip = (page - 1) * limit;

  // Exclude products belonging to suspended stores
  const activeStores = await Store.find({ isActive: true }).select('_id');
  const activeStoreIds = activeStores.map((s) => s._id);

  const filter: FilterQuery<IProduct> = {
    isArchived: false,
    storeId: { $in: activeStoreIds },
  };

  if (query.storeId) {
    const isActiveStore = activeStoreIds.some((id) => id.toString() === query.storeId);
    if (!isActiveStore) {
      return {
        items: [],
        pagination: { page, limit, total: 0, totalPages: 1 },
      };
    }
    filter.storeId = query.storeId;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.inStock) {
    filter.stock = { $gt: 0 };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.priceCents = {};
    if (query.minPrice !== undefined) {
      filter.priceCents.$gte = Math.round(query.minPrice * 100);
    }
    if (query.maxPrice !== undefined) {
      filter.priceCents.$lte = Math.round(query.maxPrice * 100);
    }
  }

  if (query.search && query.search.trim()) {
    const sanitized = query.search.trim().slice(0, 80);
    const regex = new RegExp(
      sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );
    filter.$or = [{ title: regex }, { description: regex }, { materials: regex }];
  }

  const sortMap: Record<string, Record<string, SortOrder>> = {
    newest: { createdAt: -1 },
    price_asc: { priceCents: 1 },
    price_desc: { priceCents: -1 },
    top_rated: { ratingAvg: -1, ratingCount: -1, createdAt: -1 },
  };
  const sort = sortMap[query.sort || 'newest'] || sortMap.newest;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('storeId', 'name slug logoUrl location'),
    Product.countDocuments(filter),
  ]);

  return {
    items: items.map((p) => p.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getPublicProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, isArchived: false }).populate(
    'storeId',
    'name slug description logoUrl location isActive'
  );

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  const populatedStore = product.storeId as unknown as { isActive?: boolean } | null;
  if (populatedStore && populatedStore.isActive === false) {
    throw new AppError('This store is currently unavailable.', 404);
  }

  return product.toJSON();
}

export async function listVendorProducts(vendorId: string) {
  const products = await Product.find({ vendorId })
    .sort({ createdAt: -1 })
    .populate('storeId', 'name slug');
  return products.map((p) => p.toJSON());
}

export async function updateVendorProduct(
  product: IProduct,
  updates: {
    title?: string;
    description?: string;
    materials?: string;
    category?: ProductCategory;
    price?: number;
    stock?: number;
    isArchived?: boolean | 'true' | 'false';
  },
  newFiles?: Express.Multer.File[]
) {
  if (updates.title !== undefined) product.title = updates.title;
  if (updates.description !== undefined) product.description = updates.description;
  if (updates.materials !== undefined) product.materials = updates.materials;
  if (updates.category !== undefined) product.category = updates.category;
  if (updates.price !== undefined) product.priceCents = Math.round(updates.price * 100);
  if (updates.stock !== undefined) product.stock = updates.stock;
  if (updates.isArchived !== undefined) {
    product.isArchived =
      typeof updates.isArchived === 'string'
        ? updates.isArchived === 'true'
        : updates.isArchived;
  }

  if (newFiles && newFiles.length > 0) {
    const uploadedImages = await Promise.all(
      newFiles.map((file) => uploadImageBuffer(file.buffer, 'artisans-corner/products'))
    );
    await Promise.all(product.images.map((img) => deleteCloudAsset(img.publicId)));
    product.images = uploadedImages;
  }

  await product.save();
  return product.toJSON();
}

export async function deleteVendorProduct(product: IProduct): Promise<void> {
  await Promise.all(product.images.map((img) => deleteCloudAsset(img.publicId)));
  await product.deleteOne();
}
