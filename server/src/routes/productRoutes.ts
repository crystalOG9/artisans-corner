import { Router } from 'express';
import {
  createProductHandler,
  deleteProductHandler,
  getPublicProductHandler,
  listMyProductsHandler,
  listPublicProductsHandler,
  updateProductHandler,
} from '../controllers/productController';
import {
  createReviewHandler,
  listReviewsHandler,
  reviewEligibilityHandler,
} from '../controllers/reviewController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { requireProductOwner } from '../middleware/ownership';
import { imageUpload } from '../middleware/upload';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/productValidator';
import { createReviewSchema } from '../validators/reviewValidator';

const router = Router();

router.get('/', listPublicProductsHandler);
router.get('/mine', authenticate, requireRole('vendor'), listMyProductsHandler);

router.get('/:id/reviews', listReviewsHandler);
router.get('/:id/reviews/eligibility', authenticate, reviewEligibilityHandler);
router.post(
  '/:id/reviews',
  authenticate,
  validate(createReviewSchema),
  createReviewHandler
);

router.get('/:slug', getPublicProductHandler);

router.post(
  '/',
  authenticate,
  requireRole('vendor'),
  imageUpload.array('images', 5),
  validate(createProductSchema),
  createProductHandler
);

router.patch(
  '/:id',
  authenticate,
  requireRole('vendor', 'admin'),
  requireProductOwner,
  imageUpload.array('images', 5),
  validate(updateProductSchema),
  updateProductHandler
);

router.delete(
  '/:id',
  authenticate,
  requireRole('vendor', 'admin'),
  requireProductOwner,
  deleteProductHandler
);

export default router;
