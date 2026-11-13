import { Router } from 'express';
import {
  sellerAnalyticsHandler,
  sellerOrdersHandler,
  sellerPayoutsHandler,
  sellerProductsHandler,
  sellerSimulatePayoutHandler,
  sellerUpdateOrderStatusHandler,
} from '../controllers/sellerController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { updateVendorOrderStatusSchema } from '../validators/orderValidator';

const router = Router();

router.use(authenticate, requireRole('vendor'));

router.get('/products', sellerProductsHandler);
router.get('/analytics', sellerAnalyticsHandler);
router.get('/orders', sellerOrdersHandler);
router.patch(
  '/orders/:orderId/status',
  validate(updateVendorOrderStatusSchema),
  sellerUpdateOrderStatusHandler
);
router.get('/payouts', sellerPayoutsHandler);
router.post('/payouts/:payoutId/simulate-settle', sellerSimulatePayoutHandler);

export default router;
