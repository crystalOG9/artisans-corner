import { NextFunction, Request, Response } from 'express';
import {
  computeAuthoritativeCheckout,
  getBuyerOrderById,
  listBuyerOrders,
} from '../services/orderService';

export async function validateCartHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const summary = await computeAuthoritativeCheckout(req.body.items);
    res.status(200).json({ success: true, data: { summary } });
  } catch (err) {
    next(err);
  }
}

export async function listMyOrdersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await listBuyerOrders(req.user!.id);
    res.status(200).json({ success: true, data: { orders } });
  } catch (err) {
    next(err);
  }
}

export async function getMyOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const order = await getBuyerOrderById(req.user!.id, String(req.params.id || ''));
    res.status(200).json({ success: true, data: { order } });
  } catch (err) {
    next(err);
  }
}

