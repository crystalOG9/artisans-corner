import { Router } from 'express';
import adminRoutes from './adminRoutes';
import authRoutes from './authRoutes';
import orderRoutes from './orderRoutes';
import paymentRoutes from './paymentRoutes';
import productRoutes from './productRoutes';
import sellerRoutes from './sellerRoutes';
import storeRoutes from './storeRoutes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);

export default router;
