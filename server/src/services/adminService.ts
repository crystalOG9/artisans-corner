import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

export async function getAdminOverview() {
  const [usersCount, storesCount, productsCount, paidOrderStats] = await Promise.all([
    User.countDocuments(),
    Store.countDocuments(),
    Product.countDocuments({ isArchived: false }),
    Order.aggregate<{
      paidOrdersCount: number;
      gmvCents: number;
      platformFeeCents: number;
    }>([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          paidOrdersCount: { $sum: 1 },
          gmvCents: { $sum: '$totalCents' },
          platformFeeCents: { $sum: '$platformFeeCents' },
        },
      },
    ]),
  ]);

  const orderTotals = paidOrderStats[0] || {
    paidOrdersCount: 0,
    gmvCents: 0,
    platformFeeCents: 0,
  };

  return {
    usersCount,
    storesCount,
    productsCount,
    paidOrdersCount: orderTotals.paidOrdersCount,
    gmvCents: orderTotals.gmvCents,
    platformFeeCents: orderTotals.platformFeeCents,
  };
}

export async function listAdminStores() {
  const stores = await Store.find()
    .sort({ createdAt: -1 })
    .populate('ownerId', 'name email');
  return stores.map((s) => s.toJSON());
}

export async function setAdminStoreStatus(storeId: string, isActive: boolean) {
  if (!mongoose.Types.ObjectId.isValid(storeId)) {
    throw new AppError('Invalid store identifier.', 400);
  }
  const store = await Store.findByIdAndUpdate(
    storeId,
    { isActive },
    { new: true }
  ).populate('ownerId', 'name email');

  if (!store) {
    throw new AppError('Store not found.', 404);
  }
  return store.toJSON();
}

export async function listAdminProducts() {
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('storeId', 'name slug');
  return products.map((p) => p.toJSON());
}

export async function setAdminProductArchive(
  productId: string,
  isArchived: boolean
) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product identifier.', 400);
  }
  const product = await Product.findByIdAndUpdate(
    productId,
    { isArchived },
    { new: true }
  ).populate('storeId', 'name slug');

  if (!product) {
    throw new AppError('Product not found.', 404);
  }
  return product.toJSON();
}

