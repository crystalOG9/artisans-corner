import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { toSlug } from '../utils/slugify';
import { signAuthToken } from './authService';
import { deleteCloudAsset, uploadImageBuffer } from './uploadService';

export async function createVendorStore(
  userId: string,
  input: { name: string; description: string; location?: string },
  logoFile?: Express.Multer.File
) {
  if (!logoFile) {
    throw new AppError('Please upload a store logo image (JPG, PNG, or WebP).', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User account not found.', 404);
  }

  const existingStore = await Store.findOne({ ownerId: user._id });
  if (existingStore) {
    throw new AppError('You already have a registered store profile.', 409);
  }

  const uploadedLogo = await uploadImageBuffer(logoFile.buffer, 'artisans-corner/stores');

  const store = await Store.create({
    ownerId: user._id,
    name: input.name,
    slug: toSlug(input.name),
    description: input.description,
    location: input.location || '',
    logoUrl: uploadedLogo.url,
    logoPublicId: uploadedLogo.publicId,
  });

  if (!user.roles.includes('vendor')) {
    user.roles.push('vendor');
    await user.save();
  }

  const token = signAuthToken(user);

  return {
    user: user.toJSON(),
    store: store.toJSON(),
    token,
  };
}

export async function getVendorStoreByOwner(ownerId: string) {
  const store = await Store.findOne({ ownerId });
  if (!store) {
    throw new AppError('Store profile not found. Complete Become a Seller first.', 404);
  }
  return store.toJSON();
}

export async function updateVendorStore(
  ownerId: string,
  updates: { name?: string; description?: string; location?: string },
  logoFile?: Express.Multer.File
) {
  const store = await Store.findOne({ ownerId });
  if (!store) {
    throw new AppError('Store profile not found.', 404);
  }

  if (store.isActive === false) {
    throw new AppError(
      'This store profile is suspended and cannot be modified. Please contact support.',
      403
    );
  }

  if (updates.name !== undefined) store.name = updates.name;
  if (updates.description !== undefined) store.description = updates.description;
  if (updates.location !== undefined) store.location = updates.location;

  if (logoFile) {
    const uploadedLogo = await uploadImageBuffer(logoFile.buffer, 'artisans-corner/stores');
    await deleteCloudAsset(store.logoPublicId);
    store.logoUrl = uploadedLogo.url;
    store.logoPublicId = uploadedLogo.publicId;
  }

  await store.save();
  return store.toJSON();
}

export async function listPublicStores(limit = 12) {
  const stores = await Store.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('ownerId', 'name');
  return stores.map((s) => s.toJSON());
}

export async function getPublicStoreBySlug(slug: string) {
  const store = await Store.findOne({ slug, isActive: true }).populate('ownerId', 'name');
  if (!store) {
    throw new AppError('Store not found.', 404);
  }
  const products = await Product.find({ storeId: store._id, isArchived: false })
    .sort({ createdAt: -1 })
    .populate('storeId', 'name slug logoUrl location');

  return {
    store: store.toJSON(),
    products: products.map((p) => p.toJSON()),
  };
}
