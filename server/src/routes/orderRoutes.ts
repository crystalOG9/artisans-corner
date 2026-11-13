import { Router } from 'express';
import {
  getMyOrderHandler,
  listMyOrdersHandler,
  validateCartHandler,
} from '../controllers/orderController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { validateCartSchema } from '../validators/orderValidator';

const router = Router();

router.post('/validate-cart', validate(validateCartSchema), validateCartHandler);
router.get('/my', authenticate, listMyOrdersHandler);
router.get('/:id', authenticate, getMyOrderHandler);

export default router;

