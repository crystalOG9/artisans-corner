import { NextFunction, Request, Response } from 'express';
import {
  getAdminOverview,
  listAdminProducts,
  listAdminStores,
  setAdminProductArchive,
  setAdminStoreStatus,
} from '../services/adminService';

export async function adminOverviewHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const overview = await getAdminOverview();
    res.status(200).json({ success: true, data: { overview } });
  } catch (err) {
    next(err);
  }
}

export async function adminStoresHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stores = await listAdminStores();
    res.status(200).json({ success: true, data: { stores } });
  } catch (err) {
    next(err);
  }
}

export async function adminStoreStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const store = await setAdminStoreStatus(
      String(req.params.id || ''),
      Boolean(req.body.isActive)
    );
    res.status(200).json({ success: true, data: { store } });
  } catch (err) {
    next(err);
  }
}

export async function adminProductsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const products = await listAdminProducts();
    res.status(200).json({ success: true, data: { products } });
  } catch (err) {
    next(err);
  }
}

export async function adminProductArchiveHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await setAdminProductArchive(
      String(req.params.id || ''),
      Boolean(req.body.isArchived)
    );
    res.status(200).json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
}

