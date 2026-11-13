import mongoose from 'mongoose';
import { isStripeConfigured, stripe } from '../config/stripe';
import { IShippingAddress, Order } from '../models/Order';
import { Product } from '../models/Product';
import { VendorPayout } from '../models/VendorPayout';
import { AppError } from '../utils/AppError';
import { CartItemRequest, computeAuthoritativeCheckout, generateOrderNumber } from './orderService';

export async function createCheckoutPaymentIntent(
  buyerId: string,
  items: CartItemRequest[],
  shippingAddress: IShippingAddress
) {
  if (!isStripeConfigured() || !stripe) {
    throw new AppError(
      'Stripe test payments are not configured. Set STRIPE_SECRET_KEY in server/.env.',
      503
    );
  }

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

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        buyerId,
      },
    });

    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      platformFeeCents: order.platformFeeCents,
    };
  } catch (err) {
    await Order.findByIdAndDelete(order._id);
    throw err;
  }
}

export async function finalizePaidOrder(paymentIntentId: string) {
  if (!isStripeConfigured() || !stripe) {
    throw new AppError('Stripe is not configured.', 503);
  }

  const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!order) {
    throw new AppError('Order not found for this payment intent.', 404);
  }

  // Idempotent return if already processed by webhook or prior verify call
  if (order.paymentStatus === 'paid') {
    return order.toJSON();
  }

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== 'succeeded') {
    if (intent.status === 'requires_payment_method' || intent.status === 'canceled') {
      order.paymentStatus = 'failed';
      await order.save();
    }
    throw new AppError(
      `Payment has not succeeded (current Stripe status: ${intent.status}).`,
      400
    );
  }

  if (intent.amount_received < order.totalCents) {
    throw new AppError('Verified payment amount does not match order total.', 400);
  }

  // Decrement stock safely for each item
  for (const group of order.vendorOrders) {
    for (const item of group.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        throw new AppError(
          `Insufficient remaining stock for "${item.titleSnapshot}". Please contact support.`,
          409
        );
      }
    }
  }

  order.paymentStatus = 'paid';
  await order.save();

  // Record 5% platform fee / 95% vendor payout ledger entries idempotently
  await Promise.all(
    order.vendorOrders.map((group) =>
      VendorPayout.findOneAndUpdate(
        { orderId: order._id, storeId: group.storeId },
        {
          $setOnInsert: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            storeId: group.storeId,
            vendorId: group.vendorId,
            grossCents: group.subtotalCents,
            commissionCents: group.platformFeeCents,
            netAmountCents: group.vendorNetCents,
            status: 'recorded',
          },
        },
        { upsert: true, new: true }
      )
    )
  );

  return order.toJSON();
}

export async function verifyBuyerOrderPayment(
  buyerId: string,
  paymentIntentId: string
) {
  const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!order) {
    throw new AppError('Order not found for this payment.', 404);
  }
  if (order.buyerId.toString() !== buyerId) {
    throw new AppError('Forbidden: you cannot verify another buyer’s order.', 403);
  }
  return finalizePaidOrder(paymentIntentId);
}

export async function markPaymentFailedByIntent(paymentIntentId: string) {
  const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
  if (order && order.paymentStatus === 'pending') {
    order.paymentStatus = 'failed';
    await order.save();
  }
}

export async function listVendorPayouts(vendorId: string) {
  const payouts = await VendorPayout.find({ vendorId }).sort({ createdAt: -1 });
  return payouts.map((p) => p.toJSON());
}

export async function simulateVendorPayoutSettlement(
  vendorId: string,
  payoutId: string
) {
  if (!mongoose.Types.ObjectId.isValid(payoutId)) {
    throw new AppError('Invalid payout identifier.', 400);
  }
  const payout = await VendorPayout.findById(payoutId);
  if (!payout) {
    throw new AppError('Payout record not found.', 404);
  }
  if (payout.vendorId.toString() !== vendorId) {
    throw new AppError('Forbidden: you cannot modify another vendor’s payout.', 403);
  }
  payout.status = 'settled_simulated';
  payout.settledAt = new Date();
  await payout.save();
  return payout.toJSON();
}

