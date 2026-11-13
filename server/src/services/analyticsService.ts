import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';

export interface DailySalesPoint {
  date: string;
  grossCents: number;
  netCents: number;
  orders: number;
}

export interface SellerAnalyticsSummary {
  totalGrossCents: number;
  totalPlatformFeeCents: number;
  totalNetEarningsCents: number;
  totalOrders: number;
  totalUnitsSold: number;
  activeProductsCount: number;
  salesHistory: DailySalesPoint[];
}

export async function getSellerAnalytics(
  vendorId: string
): Promise<SellerAnalyticsSummary> {
  const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

  const [activeProductsCount, orderStats, dailySeries] = await Promise.all([
    Product.countDocuments({ vendorId: vendorObjectId, isArchived: false }),
    Order.aggregate<{
      totalGrossCents: number;
      totalPlatformFeeCents: number;
      totalNetEarningsCents: number;
      totalOrders: number;
      totalUnitsSold: number;
    }>([
      { $match: { paymentStatus: 'paid', 'vendorOrders.vendorId': vendorObjectId } },
      { $unwind: '$vendorOrders' },
      { $match: { 'vendorOrders.vendorId': vendorObjectId } },
      {
        $project: {
          subtotalCents: '$vendorOrders.subtotalCents',
          platformFeeCents: '$vendorOrders.platformFeeCents',
          vendorNetCents: '$vendorOrders.vendorNetCents',
          units: { $sum: '$vendorOrders.items.quantity' },
        },
      },
      {
        $group: {
          _id: null,
          totalGrossCents: { $sum: '$subtotalCents' },
          totalPlatformFeeCents: { $sum: '$platformFeeCents' },
          totalNetEarningsCents: { $sum: '$vendorNetCents' },
          totalOrders: { $sum: 1 },
          totalUnitsSold: { $sum: '$units' },
        },
      },
    ]),
    Order.aggregate<{
      _id: string;
      grossCents: number;
      netCents: number;
      orders: number;
    }>([
      { $match: { paymentStatus: 'paid', 'vendorOrders.vendorId': vendorObjectId } },
      { $unwind: '$vendorOrders' },
      { $match: { 'vendorOrders.vendorId': vendorObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          grossCents: { $sum: '$vendorOrders.subtotalCents' },
          netCents: { $sum: '$vendorOrders.vendorNetCents' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totals = orderStats[0] || {
    totalGrossCents: 0,
    totalPlatformFeeCents: 0,
    totalNetEarningsCents: 0,
    totalOrders: 0,
    totalUnitsSold: 0,
  };

  return {
    totalGrossCents: totals.totalGrossCents,
    totalPlatformFeeCents: totals.totalPlatformFeeCents,
    totalNetEarningsCents: totals.totalNetEarningsCents,
    totalOrders: totals.totalOrders,
    totalUnitsSold: totals.totalUnitsSold,
    activeProductsCount,
    salesHistory: dailySeries.map((pt) => ({
      date: pt._id,
      grossCents: pt.grossCents,
      netCents: pt.netCents,
      orders: pt.orders,
    })),
  };
}

