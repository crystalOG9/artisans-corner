import { Router } from 'express';
import {
  adminOverviewHandler,
  adminProductArchiveHandler,
  adminProductsHandler,
  adminStoresHandler,
  adminStoreStatusHandler,
} from '../controllers/adminController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/overview', adminOverviewHandler);
router.get('/stores', adminStoresHandler);
router.patch('/stores/:id/status', adminStoreStatusHandler);
router.get('/products', adminProductsHandler);
router.patch('/products/:id/archive', adminProductArchiveHandler);

export default router;

