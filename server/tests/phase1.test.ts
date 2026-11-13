import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { Order } from '../src/models/Order';
import { Product } from '../src/models/Product';
import { Store } from '../src/models/Store';
import { User } from '../src/models/User';
import * as uploadService from '../src/services/uploadService';

const app = createApp();
let mongoServer: MongoMemoryServer;

// Minimal valid 1x1 PNG buffer for multer upload tests
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

describe('Phase 1 — Auth, Roles, Become a Seller, Image Upload & Product Ownership', () => {
  it('registers a buyer, hashes password, logs in, and rejects invalid credentials', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Maya Lin',
      email: 'maya@example.com',
      password: 'StrongPassword123',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.user.roles).toEqual(['buyer']);
    expect(regRes.body.data.user.passwordHash).toBeUndefined();
    expect(regRes.headers['set-cookie']).toBeDefined();

    const storedUser = await User.findOne({ email: 'maya@example.com' }).select('+passwordHash');
    expect(storedUser).not.toBeNull();
    expect(storedUser!.passwordHash).not.toBe('StrongPassword123');

    const badLogin = await request(app).post('/api/auth/login').send({
      email: 'maya@example.com',
      password: 'WrongPassword',
    });
    expect(badLogin.status).toBe(401);

    const goodLogin = await request(app).post('/api/auth/login').send({
      email: 'maya@example.com',
      password: 'StrongPassword123',
    });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.body.data.user.email).toBe('maya@example.com');
  });

  it('blocks unauthenticated users and prevents buyers from listing products before onboarding', async () => {
    const unauthMe = await request(app).get('/api/auth/me');
    expect(unauthMe.status).toBe(401);

    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Buyer One',
      email: 'buyer1@example.com',
      password: 'StrongPassword123',
    });

    const forbiddenProduct = await agent
      .post('/api/products')
      .field('title', 'Hand-thrown Stoneware Mug')
      .field('description', 'Wheel-thrown ceramic mug with speckled ash glaze.')
      .field('category', 'Ceramics & Pottery')
      .field('price', '42')
      .field('stock', '5')
      .attach('images', SAMPLE_PNG, 'mug.png');

    expect(forbiddenProduct.status).toBe(403);
  });

  it('completes Become a Seller onboarding, creates Store, uploads product, and enforces vendor ownership', async () => {
    let uploadCounter = 0;
    vi.spyOn(uploadService, 'uploadImageBuffer').mockImplementation(async (_buf, folder) => {
      uploadCounter += 1;
      return {
        url: `https://res.cloudinary.com/demo/image/upload/v1/${folder}/asset-${uploadCounter}.png`,
        publicId: `${folder}/asset-${uploadCounter}`,
      };
    });

    // Vendor A registers & becomes a seller
    const vendorA = request.agent(app);
    await vendorA.post('/api/auth/register').send({
      name: 'Clara Potter',
      email: 'clara@example.com',
      password: 'StrongPassword123',
    });

    const onboardRes = await vendorA
      .post('/api/stores/become-seller')
      .field('name', 'Kiln & Birch Studio')
      .field('description', 'Small-batch stoneware pottery fired in a wood kiln.')
      .field('location', 'Portland, OR')
      .attach('logo', SAMPLE_PNG, 'logo.png');

    expect(onboardRes.status).toBe(201);
    expect(onboardRes.body.data.user.roles).toContain('vendor');
    expect(onboardRes.body.data.store.logoUrl).toContain('https://res.cloudinary.com/');

    // Vendor A creates a product
    const createRes = await vendorA
      .post('/api/products')
      .field('title', 'Speckled Matcha Bowl')
      .field('description', 'Hand-formed stoneware chawan glazed in matte celadon.')
      .field('materials', 'Stoneware clay, wood ash glaze')
      .field('category', 'Ceramics & Pottery')
      .field('price', '68.50')
      .field('stock', '4')
      .attach('images', SAMPLE_PNG, 'bowl.png');

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.product.priceCents).toBe(6850);
    expect(createRes.body.data.product.images[0].url).toContain('artisans-corner/products');

    const productId = createRes.body.data.product._id;

    // Reject unsupported upload file types
    const badUpload = await vendorA
      .post('/api/products')
      .field('title', 'Invalid Upload Item')
      .field('description', 'This upload should be rejected due to text file.')
      .field('category', 'Woodwork')
      .field('price', '30')
      .field('stock', '2')
      .attach('images', Buffer.from('not-an-image'), 'note.txt');
    expect(badUpload.status).toBe(400);

    // Vendor B registers & becomes a seller
    const vendorB = request.agent(app);
    await vendorB.post('/api/auth/register').send({
      name: 'Owen Weaver',
      email: 'owen@example.com',
      password: 'StrongPassword123',
    });
    await vendorB
      .post('/api/stores/become-seller')
      .field('name', 'Loom & Flax')
      .field('description', 'Handwoven linen table runners and studio textiles.')
      .attach('logo', SAMPLE_PNG, 'loom.png');

    // Vendor B MUST NOT be able to edit or delete Vendor A's product
    const crossEdit = await vendorB.patch(`/api/products/${productId}`).send({ price: 10 });
    expect(crossEdit.status).toBe(403);

    const crossDelete = await vendorB.delete(`/api/products/${productId}`);
    expect(crossDelete.status).toBe(403);

    // Vendor A CAN edit their own product
    const ownEdit = await vendorA.patch(`/api/products/${productId}`).send({ stock: 9 });
    expect(ownEdit.status).toBe(200);
    expect(ownEdit.body.data.product.stock).toBe(9);

    // Verify Order schema relationships (Buyer -> VendorOrderGroup -> Product)
    const buyer = await User.create({
      name: 'Sam Buyer',
      email: 'sam@example.com',
      passwordHash: 'hashed',
      roles: ['buyer'],
    });
    const storeA = await Store.findOne({ name: 'Kiln & Birch Studio' });
    const prodA = await Product.findById(productId);

    const order = await Order.create({
      buyerId: buyer._id,
      orderNumber: 'AC-TEST-0001',
      shippingAddress: {
        fullName: 'Sam Buyer',
        line1: '100 Maple St',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
        phone: '555-0199',
      },
      subtotalCents: 6850,
      platformFeeCents: 343,
      totalCents: 6850,
      paymentStatus: 'pending',
      vendorOrders: [
        {
          storeId: storeA!._id,
          vendorId: prodA!.vendorId,
          status: 'Processing',
          subtotalCents: 6850,
          platformFeeCents: 343,
          vendorNetCents: 6507,
          items: [
            {
              productId: prodA!._id,
              titleSnapshot: prodA!.title,
              imageSnapshot: prodA!.images[0].url,
              unitPriceCents: 6850,
              quantity: 1,
              lineTotalCents: 6850,
            },
          ],
        },
      ],
    });

    const populated = await Order.findById(order._id).populate('buyerId', 'email');
    expect(populated?.vendorOrders[0].items[0].productId.toString()).toBe(productId);
  });
});

