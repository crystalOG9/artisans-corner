import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env';
import {
  IShippingAddress,
  IVendorOrderGroup,
  Order,
  OrderFulfillmentStatus,
} from '../models/Order';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { AppError } from '../utils/AppError';

export interface CartItemRequest {
  productId: string;
  quantity: number;
}

export interface ComputedCheckoutSummary {
  subtotalCents: number;
  platformFeeCents: number;
  totalCents: number;
  vendorOrders: IVendorOrderGroup[];
  validatedItems: Array<{
    productId: string;
    title: string;
    slug: string;
    image: string;
    unitPriceCents: number;
    quantity: number;
    stock: number;
    storeId: string;
    storeName: string;
    storeSlug: string;
  }>;
}

export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AC-${datePart}-${rand}`;
}

export async function computeAuthoritativeCheckout(
  rawItems: CartItemRequest[]
): Promise<ComputedCheckoutSummary> {
  // Merge duplicate productIds defensively
  const quantityByProduct = new Map<string, number>();
  for (const item of rawItems) {
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      throw new AppError('Invalid product identifier in cart.', 400);
    }
    quantityByProduct.set(
      item.productId,
      (quantityByProduct.get(item.productId) || 0) + item.quantity
    );
  }

  const productIds = Array.from(quantityByProduct.keys());
  const products = await Product.find({
    _id: { $in: productIds },
    isArchived: false,
  }).populate('storeId', 'name slug isActive');

  if (products.length !== productIds.length) {
    throw new AppError(
      'One or more items in your cart are no longer available.',
      400
    );
  }

  const bps = env.PLATFORM_COMMISSION_BPS; // default 500 = 5%
  const vendorGroupsMap = new Map<string, IVendorOrderGroup>();
  const validatedItems: ComputedCheckoutSummary['validatedItems'] = [];

  for (const product of products) {
    const qty = quantityByProduct.get(product._id.toString())!;
    const storeDoc = product.storeId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      slug: string;
      isActive: boolean;
    };

    if (!storeDoc || !storeDoc.isActive) {
      throw new AppError(
        `Store for "${product.title}" is currently unavailable.`,
        400
      );
    }

    if (product.stock < qty) {
      throw new AppError(
        `Insufficient stock for "${product.title}". Available: ${product.stock}.`,
        400
      );
    }

    const lineTotalCents = product.priceCents * qty;
    const storeKey = storeDoc._id.toString();

    if (!vendorGroupsMap.has(storeKey)) {
      vendorGroupsMap.set(storeKey, {
        storeId: storeDoc._id,
        vendorId: product.vendorId,
        status: 'Processing',
        trackingNumber: '',
        subtotalCents: 0,
        platformFeeCents: 0,
        vendorNetCents: 0,
        items: [],
      });
    }

    const group = vendorGroupsMap.get(storeKey)!;
    group.items.push({
      productId: product._id,
      titleSnapshot: product.title,
      imageSnapshot: product.images[0]?.url || '',
      unitPriceCents: product.priceCents,
      quantity: qty,
      lineTotalCents,
    });
    group.subtotalCents += lineTotalCents;

    validatedItems.push({
      productId: product._id.toString(),
      title: product.title,
      slug: product.slug,
      image: product.images[0]?.url || '',
      unitPriceCents: product.priceCents,
      quantity: qty,
      stock: product.stock,
      storeId: storeDoc._id.toString(),
      storeName: storeDoc.name,
      storeSlug: storeDoc.slug,
    });
  }

  let totalSubtotalCents = 0;
  let totalPlatformFeeCents = 0;
  const vendorOrders = Array.from(vendorGroupsMap.values()).map((group) => {
    const fee = Math.round((group.subtotalCents * bps) / 10000);
    const net = group.subtotalCents - fee;
    totalSubtotalCents += group.subtotalCents;
    totalPlatformFeeCents += fee;
    return {
      ...group,
      platformFeeCents: fee,
      vendorNetCents: net,
    };
  });

  return {
    subtotalCents: totalSubtotalCents,
    platformFeeCents: totalPlatformFeeCents,
    totalCents: totalSubtotalCents,
    vendorOrders,
    validatedItems,
  };
}

export async function createPendingOrder(
  buyerId: string,
  items: CartItemRequest[],
  shippingAddress: IShippingAddress
) {
  const computed = await computeAuthoritativeCheckout(items);

  const order = await Order.create({
    buyerId,
    orderNumber: generateOrderNumber(),
    shippingAddress,
    subtotalCents: computed.subtotalCents,
    platformFeeCents: computed.platformFeeCents,
    totalCents: computed.totalCents,
    paymentStatus: 'pending',
    vendorOrders: computed.vendorOrders,
  });

  return order;
}

export async function listBuyerOrders(buyerId: string) {
  const orders = await Order.find({ buyerId, paymentStatus: 'paid' })
    .sort({ createdAt: -1 })
    .populate('vendorOrders.storeId', 'name slug');
  return orders.map((o) => o.toJSON());
}

export async function getBuyerOrderById(buyerId: string, orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order identifier.', 400);
  }
  const order = await Order.findById(orderId).populate(
    'vendorOrders.storeId',
    'name slug'
  );
  if (!order) {
    throw new AppError('Order not found.', 404);
  }
  if (order.buyerId.toString() !== buyerId) {
    throw new AppError('Forbidden: you cannot access another buyer’s order.', 403);
  }
  return order.toJSON();
}

export async function listVendorOrders(vendorId: string) {
  const orders = await Order.find({
    paymentStatus: 'paid',
    'vendorOrders.vendorId': vendorId,
  })
    .sort({ createdAt: -1 })
    .populate('buyerId', 'name email');

  return orders.map((order) => {
    const obj = order.toJSON() as Record<string, unknown>;
    const ownSlice = order.vendorOrders.find(
      (vo) => vo.vendorId.toString() === vendorId
    );
    return {
      _id: obj._id,
      orderNumber: obj.orderNumber,
      buyer: obj.buyerId,
      shippingAddress: obj.shippingAddress,
      paymentStatus: obj.paymentStatus,
      createdAt: obj.createdAt,
      vendorOrder: ownSlice,
    };
  });
}

export async function updateVendorOrderFulfillment(
  vendorId: string,
  orderId: string,
  status: OrderFulfillmentStatus,
  trackingNumber: string
) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order identifier.', 400);
  }

  const store = await Store.findOne({ ownerId: vendorId });
  if (!store) {
    throw new AppError('Store profile not found.', 404);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  if (order.paymentStatus !== 'paid') {
    throw new AppError('Cannot fulfill an unpaid order.', 400);
  }

  const vendorGroup = order.vendorOrders.find(
    (vo) => vo.vendorId.toString() === vendorId
  );
  if (!vendorGroup) {
    throw new AppError(
      'Forbidden: this order does not belong to your store.',
      403
    );
  }

  vendorGroup.status = status;
  if (trackingNumber) {
    vendorGroup.trackingNumber = trackingNumber;
  }
  await order.save();

  return vendorGroup;
}

