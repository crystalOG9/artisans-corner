import { Router } from 'express';
import {
  becomeSellerHandler,
  listPublicStoresHandler,
  myStoreHandler,
  publicStoreHandler,
  updateMyStoreHandler,
} from '../controllers/storeController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { imageUpload } from '../middleware/upload';
import { validate } from '../middleware/validate';
import {
  becomeSellerSchema,
  updateStoreSchema,
} from '../validators/storeValidator';

const router = Router();

router.get('/', listPublicStoresHandler);

router.post(
  '/become-seller',
  authenticate,
  imageUpload.single('logo'),
  validate(becomeSellerSchema),
  becomeSellerHandler
);

router.get('/me', authenticate, requireRole('vendor'), myStoreHandler);
router.patch(
  '/me',
  authenticate,
  requireRole('vendor'),
  imageUpload.single('logo'),
  validate(updateStoreSchema),
  updateMyStoreHandler
);

router.get('/:slug', publicStoreHandler);

export default router;
