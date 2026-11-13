import { Router } from 'express';
import {
  createIntentHandler,
  paymentConfigHandler,
  verifyPaymentHandler,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createPaymentIntentSchema } from '../validators/orderValidator';

const router = Router();

router.get('/config', paymentConfigHandler);
router.post(
  '/create-intent',
  authenticate,
  validate(createPaymentIntentSchema),
  createIntentHandler
);
router.post('/verify', authenticate, verifyPaymentHandler);

export default router;

