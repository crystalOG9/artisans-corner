import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { Order } from '../src/models/Order';
import { Store } from '../src/models/Store';
import { User } from '../src/models/User';
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
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const col of collections) {
    await col.deleteMany({});
  }
  vi.restoreAllMocks();
});

describe('Phase 2 — Marketplace Discovery, Vendor CRUD & Real Analytics', () => {
  it('serves filtered public catalog, product detail, and store detail while hiding archived items', async () => {
    let idx = 0;
    vi.spyOn(uploadService, 'uploadImageBuffer').mockImplementation(async (_b, folder) => {
      idx += 1;
      return {
        url: `https://res.cloudinary.com/demo/image/upload/v1/${folder}/p-${idx}.png`,
        publicId: `${folder}/p-${idx}`,
      };
    });

    const vendor = request.agent(app);
    await vendor.post('/api/auth/register').send({
      name: 'Elena Woods',
      email: 'elena@example.com',
      password: 'StrongPassword123',
    });

    const storeRes = await vendor
      .post('/api/stores/become-seller')
      .field('name', 'Oak & Chisel')
      .field('description', 'Hand-carved walnut serving boards and kitchenware.')
      .field('location', 'Vermont')
      .attach('logo', SAMPLE_PNG, 'logo.png');

    const storeSlug = storeRes.body.data.store.slug;

    const p1 = await vendor
      .post('/api/products')
      .field('title', 'Walnut Serving Board')
      .field('description', 'Hand-planed black walnut board finished with beeswax.')
      .field('category', 'Woodwork')
      .field('price', '85')
      .field('stock', '3')
      .attach('images', SAMPLE_PNG, 'board.png');

    const p2 = await vendor
      .post('/api/products')
      .field('title', 'Archived Prototype Spoon')
      .field('description', 'Experimental carved spoon marked as archived.')
      .field('category', 'Woodwork')
      .field('price', '25')
      .field('stock', '1')
      .attach('images', SAMPLE_PNG, 'spoon.png');

    await vendor
      .patch(`/api/products/${p2.body.data.product._id}`)
      .send({ isArchived: true });

    const listRes = await request(app).get('/api/products?category=Woodwork&search=Walnut');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items).toHaveLength(1);
    expect(listRes.body.data.items[0].title).toBe('Walnut Serving Board');

    const detailRes = await request(app).get(`/api/products/${p1.body.data.product.slug}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.product.storeId.name).toBe('Oak & Chisel');

    const storePublicRes = await request(app).get(`/api/stores/${storeSlug}`);
    expect(storePublicRes.status).toBe(200);
    expect(storePublicRes.body.data.products).toHaveLength(1);
  });

  it('blocks non-vendors from seller analytics and calculates real non-fabricated earnings', async () => {
    vi.spyOn(uploadService, 'uploadImageBuffer').mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/item.png',
      publicId: 'item',
    });

    const buyer = request.agent(app);
    await buyer.post('/api/auth/register').send({
      name: 'Only Buyer',
      email: 'buyer@example.com',
      password: 'StrongPassword123',
    });
    const blocked = await buyer.get('/api/seller/analytics');
    expect(blocked.status).toBe(403);

    const vendor = request.agent(app);
    const vReg = await vendor.post('/api/auth/register').send({
      name: 'Nora Clay',
      email: 'nora@example.com',
      password: 'StrongPassword123',
    });
    const vendorId = vReg.body.data.user._id;

    await vendor
      .post('/api/stores/become-seller')
      .field('name', 'Clay Vessel Co')
      .field('description', 'Handbuilt ceramic vessels and tableware.')
      .attach('logo', SAMPLE_PNG, 'logo.png');

    // Empty state check for new seller
    const emptyAnalytics = await vendor.get('/api/seller/analytics');
    expect(emptyAnalytics.status).toBe(200);
    expect(emptyAnalytics.body.data.analytics.totalNetEarningsCents).toBe(0);
    expect(emptyAnalytics.body.data.analytics.salesHistory).toEqual([]);

    const prodRes = await vendor
      .post('/api/products')
      .field('title', 'Terracotta Pitcher')
      .field('description', 'Wheel-thrown pitcher with raw clay exterior.')
      .field('category', 'Ceramics & Pottery')
      .field('price', '100')
      .field('stock', '5')
      .attach('images', SAMPLE_PNG, 'pitcher.png');

    const store = await Store.findOne({ ownerId: vendorId });
    const buyerUser = await User.findOne({ email: 'buyer@example.com' });

    // Create 1 paid order ($100 -> $5 fee, $95 net) and 1 pending order (must NOT count)
    await Order.create([
      {
        buyerId: buyerUser!._id,
        orderNumber: 'AC-PAID-1',
        shippingAddress: {
          fullName: 'Only Buyer',
          line1: '12 Pine Rd',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
          phone: '555-0100',
        },
        subtotalCents: 10000,
        platformFeeCents: 500,
        totalCents: 10000,
        paymentStatus: 'paid',
        vendorOrders: [
          {
            storeId: store!._id,
            vendorId,
            status: 'Processing',
            subtotalCents: 10000,
            platformFeeCents: 500,
            vendorNetCents: 9500,
            items: [
              {
                productId: prodRes.body.data.product._id,
                titleSnapshot: 'Terracotta Pitcher',
                imageSnapshot: 'https://res.cloudinary.com/demo/image/upload/v1/item.png',
                unitPriceCents: 10000,
                quantity: 1,
                lineTotalCents: 10000,
              },
            ],
          },
        ],
      },
      {
        buyerId: buyerUser!._id,
        orderNumber: 'AC-PEND-2',
        shippingAddress: {
          fullName: 'Only Buyer',
          line1: '12 Pine Rd',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
          phone: '555-0100',
        },
        subtotalCents: 10000,
        platformFeeCents: 500,
        totalCents: 10000,
        paymentStatus: 'pending',
        vendorOrders: [
          {
            storeId: store!._id,
            vendorId,
            status: 'Processing',
            subtotalCents: 10000,
            platformFeeCents: 500,
            vendorNetCents: 9500,
            items: [
              {
                productId: prodRes.body.data.product._id,
                titleSnapshot: 'Terracotta Pitcher',
                imageSnapshot: 'https://res.cloudinary.com/demo/image/upload/v1/item.png',
                unitPriceCents: 10000,
                quantity: 1,
                lineTotalCents: 10000,
              },
            ],
          },
        ],
      },
    ]);

    const realAnalytics = await vendor.get('/api/seller/analytics');
    expect(realAnalytics.status).toBe(200);
    expect(realAnalytics.body.data.analytics.totalGrossCents).toBe(10000);
    expect(realAnalytics.body.data.analytics.totalPlatformFeeCents).toBe(500);
    expect(realAnalytics.body.data.analytics.totalNetEarningsCents).toBe(9500);
    expect(realAnalytics.body.data.analytics.totalOrders).toBe(1);
    expect(realAnalytics.body.data.analytics.salesHistory).toHaveLength(1);
  });
});

