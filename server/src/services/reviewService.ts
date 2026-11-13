import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { AppError } from '../utils/AppError';

export async function listProductReviews(productId: string) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product identifier.', 400);
  }

  const reviews = await Review.find({ productId })
    .sort({ createdAt: -1 })
    .populate('buyerId', 'name');

  return reviews.map((r) => r.toJSON());
}

export async function checkBuyerReviewEligibility(
  buyerId: string,
  productId: string
): Promise<{ canReview: boolean; alreadyReviewed: boolean }> {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { canReview: false, alreadyReviewed: false };
  }

  const [existingReview, paidOrder] = await Promise.all([
    Review.findOne({ productId, buyerId }),
    Order.findOne({
      buyerId,
      paymentStatus: 'paid',
      'vendorOrders.items.productId': new mongoose.Types.ObjectId(productId),
    }),
  ]);

  return {
    canReview: Boolean(paidOrder) && !existingReview,
    alreadyReviewed: Boolean(existingReview),
  };
}

export async function createVerifiedReview(
  buyerId: string,
  productId: string,
  rating: number,
  comment: string
) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product identifier.', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  const verifiedOrder = await Order.findOne({
    buyerId,
    paymentStatus: 'paid',
    'vendorOrders.items.productId': product._id,
  });

  if (!verifiedOrder) {
    throw new AppError(
      'Only verified buyers who purchased this product can leave a review.',
      403
    );
  }

  const existing = await Review.findOne({ productId: product._id, buyerId });
  if (existing) {
    throw new AppError('You have already reviewed this product.', 409);
  }

  const review = await Review.create({
    productId: product._id,
    buyerId,
    orderId: verifiedOrder._id,
    rating,
    comment,
  });

  const stats = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { productId: product._id } },
    {
      $group: {
        _id: null,
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats[0]) {
    product.ratingAvg = Number(stats[0].avg.toFixed(2));
    product.ratingCount = stats[0].count;
    await product.save();
  }

  const populated = await review.populate('buyerId', 'name');
  return populated.toJSON();
}

