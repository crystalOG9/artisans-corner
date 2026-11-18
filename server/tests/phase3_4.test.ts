import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import * as stripeConfig from '../src/config/stripe';
import { Order } from '../src/models/Order';
import { Product } from '../src/models/Product';
import { User } from '../src/models/User';
import { VendorPayout } from '../src/models/VendorPayout';
import * as uploadService from '../src/services/uploadService';

const app = createApp();
let mongoServer: MongoMemoryServer;

const SAMPLE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const col of collections) {
    await col.deleteMany({});
  }
  vi.restoreAllMocks();
});

describe('Phase 3 & 4 — Multi-Vendor Checkout, Stripe PaymentIntent, 5% Commission, Fulfillment & Verified Reviews', () => {
  it('runs the full multi-vendor purchase, Stripe success/failure, 5%/95% payout ledger, fulfillment, and verified review journey', async () => {
    vi.spyOn(uploadService, 'uploadImageBuffer').mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/craft.png',
      publicId: 'craft',
    });

    // Setup Vendor 1 ($100 item) and Vendor 2 ($40 item)
    const vendor1 = request.agent(app);
    await vendor1.post('/api/auth/register').send({
      name: 'Vendor One',
      email: 'v1@example.com',
      password: 'StrongPassword123',
    });
    await vendor1
      .post('/api/stores/become-seller')
      .field('name', 'Studio One')
      .field('description', 'Handcrafted ceramic tableware and mugs.')
      .attach('logo', SAMPLE_PNG, 'v1.png');
    const p1Res = await vendor1
      .post('/api/products')
      .field('title', 'Ceramic Carafe')
      .field('description', 'Wheel-thrown carafe with matte ash glaze.')
      .field('category', 'Ceramics & Pottery')
      .field('price', '100')
      .field('stock', '3')
      .attach('images', SAMPLE_PNG, 'p1.png');
    const prod1Id = p1Res.body.data.product._id;

    const vendor2 = request.agent(app);
    await vendor2.post('/api/auth/register').send({
      name: 'Vendor Two',
      email: 'v2@example.com',
      password: 'StrongPassword123',
    });
    await vendor2
      .post('/api/stores/become-seller')
      .field('name', 'Studio Two')
      .field('description', 'Handwoven linen coasters and runners.')
      .attach('logo', SAMPLE_PNG, 'v2.png');
    const p2Res = await vendor2
      .post('/api/products')
      .field('title', 'Woven Linen Runner')
      .field('description', 'Natural flax table runner woven on a floor loom.')
      .field('category', 'Textiles & Weaving')
      .field('price', '40')
      .field('stock', '5')
      .attach('images', SAMPLE_PNG, 'p2.png');
    const prod2Id = p2Res.body.data.product._id;

    // Buyer + Non-buyer
    const buyer = request.agent(app);
    await buyer.post('/api/auth/register').send({
      name: 'Buyer Alice',
      email: 'alice@example.com',
      password: 'StrongPassword123',
    });

    const nonBuyer = request.agent(app);
    await nonBuyer.post('/api/auth/register').send({
      name: 'Non Buyer Bob',
      email: 'bob@example.com',
      password: 'StrongPassword123',
    });

    // 1. Authoritative cart validation
    const cartCheck = await buyer.post('/api/orders/validate-cart').send({
      items: [
        { productId: prod1Id, quantity: 1 },
        { productId: prod2Id, quantity: 1 },
      ],
    });
    expect(cartCheck.status).toBe(200);
    expect(cartCheck.body.data.summary.totalCents).toBe(14000);
    expect(cartCheck.body.data.summary.platformFeeCents).toBe(700); // $5 + $2 = $7

    // Mock Stripe SDK
    let stripeIntentStatus: 'requires_payment_method' | 'succeeded' =
      'requires_payment_method';
    const mockStripe = {
      paymentIntents: {
        create: vi.fn(async (params: { amount: number }) => ({
          id: 'pi_test_123',
          client_secret: 'pi_test_123_secret_abc',
          amount: params.amount,
        })),
        retrieve: vi.fn(async () => ({
          id: 'pi_test_123',
          status: stripeIntentStatus,
          amount_received: stripeIntentStatus === 'succeeded' ? 14000 : 0,
        })),
      },
    };
    vi.spyOn(stripeConfig, 'isStripeConfigured').mockReturnValue(true);
    vi.spyOn(stripeConfig, 'stripe', 'get').mockReturnValue(
      mockStripe as unknown as typeof stripeConfig.stripe
    );

    const shippingAddress = {
      fullName: 'Alice Mercer',
      line1: '420 Cedar Lane',
      city: 'Portland',
      state: 'OR',
      postalCode: '97205',
      country: 'US',
      phone: '503-555-0142',
    };

    // 2. Create PaymentIntent (creates pending order with server-computed $140 total)
    const intentRes = await buyer.post('/api/payments/create-intent').send({
      items: [
        { productId: prod1Id, quantity: 1 },
        { productId: prod2Id, quantity: 1 },
      ],
      shippingAddress,
    });
    expect(intentRes.status).toBe(201);
    expect(intentRes.body.data.totalCents).toBe(14000);
    const orderId = intentRes.body.data.orderId;

    // 3. Payment failure path: stock must NOT change, order becomes failed
    const failVerify = await buyer.post('/api/payments/verify').send({
      paymentIntentId: 'pi_test_123',
    });
    expect(failVerify.status).toBe(400);
    const failedOrder = await Order.findById(orderId);
    expect(failedOrder?.paymentStatus).toBe('failed');
    expect((await Product.findById(prod1Id))?.stock).toBe(3);

    // 4. Payment success path + idempotency
    stripeIntentStatus = 'succeeded';
    const okVerify1 = await buyer.post('/api/payments/verify').send({
      paymentIntentId: 'pi_test_123',
    });
    expect(okVerify1.status).toBe(200);
    expect(okVerify1.body.data.order.paymentStatus).toBe('paid');

    // Second verify call must be idempotent (stock stays 2, not 1)
    const okVerify2 = await buyer.post('/api/payments/verify').send({
      paymentIntentId: 'pi_test_123',
    });
    expect(okVerify2.status).toBe(200);
    expect((await Product.findById(prod1Id))?.stock).toBe(2);
    expect((await Product.findById(prod2Id))?.stock).toBe(4);

    // 5. Verify 5% platform fee / 95% vendor payout ledger ($100 -> $5/$95, $40 -> $2/$38)
    const payouts = await VendorPayout.find({ orderId }).sort({ grossCents: -1 });
    expect(payouts).toHaveLength(2);
    expect(payouts[0].grossCents).toBe(10000);
    expect(payouts[0].commissionCents).toBe(500);
    expect(payouts[0].netAmountCents).toBe(9500);
    expect(payouts[1].grossCents).toBe(4000);
    expect(payouts[1].commissionCents).toBe(200);
    expect(payouts[1].netAmountCents).toBe(3800);

    // Vendor 1 simulates settling payout
    const settleRes = await vendor1.post(
      `/api/seller/payouts/${payouts[0]._id}/simulate-settle`
    );
    expect(settleRes.status).toBe(200);
    expect(settleRes.body.data.payout.status).toBe('settled_simulated');

    // 6. Vendor fulfillment queue isolation & status update
    const v1Orders = await vendor1.get('/api/seller/orders');
    expect(v1Orders.status).toBe(200);
    expect(v1Orders.body.data.orders).toHaveLength(1);
    expect(v1Orders.body.data.orders[0].vendorOrder.items).toHaveLength(1);
    expect(v1Orders.body.data.orders[0].vendorOrder.items[0].titleSnapshot).toBe(
      'Ceramic Carafe'
    );

    const shipRes = await vendor1
      .patch(`/api/seller/orders/${orderId}/status`)
      .send({ status: 'Shipped', trackingNumber: '1Z999AA101234' });
    expect(shipRes.status).toBe(200);
    expect(shipRes.body.data.vendorOrder.status).toBe('Shipped');

    // 7. Verified buyer reviews: non-buyer blocked (403), verified buyer succeeds (201), duplicate blocked (409)
    const nonBuyerReview = await nonBuyer
      .post(`/api/products/${prod1Id}/reviews`)
      .send({ rating: 5, comment: 'Trying to review without purchasing.' });
    expect(nonBuyerReview.status).toBe(403);

    const buyerReview = await buyer
      .post(`/api/products/${prod1Id}/reviews`)
      .send({ rating: 5, comment: 'Beautiful glaze and arrived safely packaged.' });
    expect(buyerReview.status).toBe(201);

    const dupReview = await buyer
      .post(`/api/products/${prod1Id}/reviews`)
      .send({ rating: 4, comment: 'Trying a duplicate review.' });
    expect(dupReview.status).toBe(409);

    const updatedProd1 = await Product.findById(prod1Id);
    expect(updatedProd1?.ratingAvg).toBe(5);
    expect(updatedProd1?.ratingCount).toBe(1);

    // 8. Admin overview access control & metrics
    const buyerAdminBlocked = await buyer.get('/api/admin/overview');
    expect(buyerAdminBlocked.status).toBe(403);

    await User.create({
      name: 'Platform Admin',
      email: 'admin@example.com',
      passwordHash: '$2a$12$dummyhash',
      roles: ['admin'],
    });
    const adminAgent = request.agent(app);
    // Log in via bcrypt user
    await User.deleteOne({ email: 'admin@example.com' });
    await request(app).post('/api/auth/register').send({
      name: 'Platform Admin',
      email: 'admin@example.com',
      password: 'StrongPassword123',
    });
    await User.updateOne({ email: 'admin@example.com' }, { $set: { roles: ['admin'] } });
    await adminAgent.post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'StrongPassword123',
    });

    const adminOverview = await adminAgent.get('/api/admin/overview');
    expect(adminOverview.status).toBe(200);
    expect(adminOverview.body.data.overview.gmvCents).toBe(14000);
    expect(adminOverview.body.data.overview.platformFeeCents).toBe(700);
  });
});

