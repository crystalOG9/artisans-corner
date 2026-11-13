import { NextFunction, Request, Response } from 'express';
import {
  checkBuyerReviewEligibility,
  createVerifiedReview,
  listProductReviews,
} from '../services/reviewService';

export async function listReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviews = await listProductReviews(String(req.params.id || ''));
    res.status(200).json({ success: true, data: { reviews } });
  } catch (err) {
    next(err);
  }
}

export async function reviewEligibilityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eligibility = await checkBuyerReviewEligibility(
      req.user!.id,
      String(req.params.id || '')
    );
    res.status(200).json({ success: true, data: eligibility });
  } catch (err) {
    next(err);
  }
}

export async function createReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const review = await createVerifiedReview(
      req.user!.id,
      String(req.params.id || ''),
      req.body.rating,
      req.body.comment
    );
    res.status(201).json({ success: true, data: { review } });
  } catch (err) {
    next(err);
  }
}

