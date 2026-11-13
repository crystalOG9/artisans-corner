import { NextFunction, Request, Response } from 'express';
import {
  createProductForVendor,
  deleteVendorProduct,
  getPublicProductBySlug,
  listPublicProducts,
  listVendorProducts,
  updateVendorProduct,
} from '../services/productService';

export async function listPublicProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await listPublicProducts({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      storeId: req.query.storeId ? String(req.query.storeId) : undefined,
      inStock: req.query.inStock === 'true',
      sort: req.query.sort as
        | 'newest'
        | 'price_asc'
        | 'price_desc'
        | 'top_rated'
        | undefined,
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPublicProductHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await getPublicProductBySlug(String(req.params.slug || ''));
    res.status(200).json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
}

export async function createProductHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const product = await createProductForVendor(req.user!.id, req.body, files);
    res.status(201).json({
      success: true,
      data: { product },
    });
  } catch (err) {
    next(err);
  }
}

export async function listMyProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const products = await listVendorProducts(req.user!.id);
    res.status(200).json({
      success: true,
      data: { products },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProductHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const product = await updateVendorProduct(req.product!, req.body, files);
    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteProductHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteVendorProduct(req.product!);
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
