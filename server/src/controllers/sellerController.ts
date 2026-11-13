import { NextFunction, Request, Response } from 'express';
import { getSellerAnalytics } from '../services/analyticsService';
import {
  listVendorOrders,
  updateVendorOrderFulfillment,
} from '../services/orderService';
import {
  listVendorPayouts,
  simulateVendorPayoutSettlement,
} from '../services/paymentService';
import { listVendorProducts } from '../services/productService';

export async function sellerAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const analytics = await getSellerAnalytics(req.user!.id);
    res.status(200).json({ success: true, data: { analytics } });
  } catch (err) {
    next(err);
  }
}

export async function sellerProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const products = await listVendorProducts(req.user!.id);
    res.status(200).json({ success: true, data: { products } });
  } catch (err) {
    next(err);
  }
}

export async function sellerOrdersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await listVendorOrders(req.user!.id);
    res.status(200).json({ success: true, data: { orders } });
  } catch (err) {
    next(err);
  }
}

export async function sellerUpdateOrderStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendorOrder = await updateVendorOrderFulfillment(
      req.user!.id,
      String(req.params.orderId || ''),
      req.body.status,
      req.body.trackingNumber
    );
    res.status(200).json({ success: true, data: { vendorOrder } });
  } catch (err) {
    next(err);
  }
}

export async function sellerPayoutsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payouts = await listVendorPayouts(req.user!.id);
    res.status(200).json({ success: true, data: { payouts } });
  } catch (err) {
    next(err);
  }
}

export async function sellerSimulatePayoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payout = await simulateVendorPayoutSettlement(
      req.user!.id,
      String(req.params.payoutId || '')
    );
    res.status(200).json({ success: true, data: { payout } });
  } catch (err) {
    next(err);
  }
}
