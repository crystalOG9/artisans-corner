import { NextFunction, Request, Response } from 'express';
import {
  createVendorStore,
  getPublicStoreBySlug,
  getVendorStoreByOwner,
  listPublicStores,
  updateVendorStore,
} from '../services/storeService';
import { setAuthCookie } from '../utils/cookies';

export async function becomeSellerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await createVendorStore(req.user!.id, req.body, req.file);
    setAuthCookie(res, result.token);
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        store: result.store,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function myStoreHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const store = await getVendorStoreByOwner(req.user!.id);
    res.status(200).json({ success: true, data: { store } });
  } catch (err) {
    next(err);
  }
}

export async function updateMyStoreHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const store = await updateVendorStore(req.user!.id, req.body, req.file);
    res.status(200).json({ success: true, data: { store } });
  } catch (err) {
    next(err);
  }
}

export async function listPublicStoresHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = Number(req.query.limit) || 12;
    const stores = await listPublicStores(Math.min(24, limit));
    res.status(200).json({ success: true, data: { stores } });
  } catch (err) {
    next(err);
  }
}

export async function publicStoreHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getPublicStoreBySlug(String(req.params.slug || ''));
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
