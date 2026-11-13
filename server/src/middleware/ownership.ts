import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { IProduct, Product } from '../models/Product';
import { AppError } from '../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      product?: IProduct;
    }
  }
}

export async function requireProductOwner(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = String(req.params.id || '');
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new AppError('Invalid product identifier.', 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found.', 404));
    }

    const isAdmin = req.user?.roles.includes('admin');
    const isOwner = req.user && product.vendorId.toString() === req.user.id;

    if (!isOwner && !isAdmin) {
      return next(
        new AppError('Forbidden: you can only modify products in your own store.', 403)
      );
    }

    req.product = product;
    next();
  } catch (err) {
    next(err);
  }
}

