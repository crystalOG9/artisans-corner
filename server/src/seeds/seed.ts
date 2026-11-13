import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { assertServerEnv, env } from '../config/env';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { VendorPayout } from '../models/VendorPayout';

async function seed() {
  assertServerEnv();
  await connectDatabase(env.MONGODB_URI!);

  console.log('Seeding Artisan’s Corner demo marketplace data...');

  const [buyerHash, vendorHash, adminHash] = await Promise.all([
    bcrypt.hash('DemoBuyer123!', 12),
    bcrypt.hash('DemoVendor123!', 12),
    bcrypt.hash('DemoAdmin123!', 12),
  ]);

  const demoBuyer = await User.findOneAndUpdate(
    { email: 'buyer@artisanscorner.demo' },
    {
      name: 'Maya Buyer (Demo)',
      email: 'buyer@artisanscorner.demo',
      passwordHash: buyerHash,
      roles: ['buyer'],
    },
    { upsert: true, new: true }
  );

  const demoVendor1 = await User.findOneAndUpdate(
    { email: 'vendor@artisanscorner.demo' },
    {
      name: 'Clara Potter (Demo Vendor)',
      email: 'vendor@artisanscorner.demo',
      passwordHash: vendorHash,
      roles: ['buyer', 'vendor'],
    },
    { upsert: true, new: true }
  );

  const demoVendor2 = await User.findOneAndUpdate(
    { email: 'weaver@artisanscorner.demo' },
    {
      name: 'Owen Weaver (Demo Vendor)',
      email: 'weaver@artisanscorner.demo',
      passwordHash: vendorHash,
      roles: ['buyer', 'vendor'],
    },
    { upsert: true, new: true }
  );

  await User.findOneAndUpdate(
    { email: 'admin@artisanscorner.demo' },
    {
      name: 'Admin Curator (Demo)',
      email: 'admin@artisanscorner.demo',
      passwordHash: adminHash,
      roles: ['buyer', 'admin'],
    },
    { upsert: true, new: true }
  );

  const store1 = await Store.findOneAndUpdate(
    { ownerId: demoVendor1._id },
    {
      ownerId: demoVendor1._id,
      name: 'Kiln & Birch Studio',
      slug: 'kiln-and-birch-studio',
      description:
        'Small-batch stoneware pottery wheel-thrown and wood-fired in Portland, Oregon.',
      location: 'Portland, OR',
      logoUrl:
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=400&q=80',
      logoPublicId: 'seed/kiln-birch-logo',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const store2 = await Store.findOneAndUpdate(
    { ownerId: demoVendor2._id },
    {
      ownerId: demoVendor2._id,
      name: 'Loom & Flax Studio',
      slug: 'loom-and-flax-studio',
      description:
        'Handwoven organic linen table runners, napkins, and studio textiles.',
      location: 'Burlington, VT',
      logoUrl:
        'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=400&q=80',
      logoPublicId: 'seed/loom-flax-logo',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const prod1 = await Product.findOneAndUpdate(
    { slug: 'speckled-stoneware-pour-over-carafe' },
    {
      storeId: store1._id,
      vendorId: demoVendor1._id,
      title: 'Speckled Stoneware Pour-Over Carafe',
      slug: 'speckled-stoneware-pour-over-carafe',
      description:
        'Wheel-thrown stoneware pour-over set finished with a satin ash glaze. Holds 500 ml and fits standard #2 paper filters.',
      materials: 'Speckled stoneware clay, food-safe matte ash glaze',
      category: 'Ceramics & Pottery',
      priceCents: 6800,
      stock: 8,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/stoneware-carafe',
        },
      ],
      isArchived: false,
    },
    { upsert: true, new: true }
  );

  await Product.findOneAndUpdate(
    { slug: 'matte-celadon-matcha-bowl' },
    {
      storeId: store1._id,
      vendorId: demoVendor1._id,
      title: 'Matte Celadon Matcha Bowl',
      slug: 'matte-celadon-matcha-bowl',
      description:
        'Hand-trimmed ceramic chawan with an ergonomic foot ring and warm celadon interior.',
      materials: 'Buff stoneware, celadon glaze',
      category: 'Ceramics & Pottery',
      priceCents: 5400,
      stock: 6,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/celadon-bowl',
        },
      ],
      isArchived: false,
    },
    { upsert: true, new: true }
  );

  await Product.findOneAndUpdate(
    { slug: 'handwoven-flax-table-runner' },
    {
      storeId: store2._id,
      vendorId: demoVendor2._id,
      title: 'Handwoven Flax Table Runner',
      slug: 'handwoven-flax-table-runner',
      description:
        'Woven on a four-harness floor loom using unbleached European flax linen with hand-knotted fringe.',
      materials: '100% European flax linen',
      category: 'Textiles & Weaving',
      priceCents: 10000,
      stock: 5,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/flax-runner',
        },
      ],
      isArchived: false,
    },
    { upsert: true, new: true }
  );

  // Create one verified sample order so Demo Buyer can inspect order history & Demo Vendor sees real analytics
  const existingOrder = await Order.findOne({ orderNumber: 'AC-DEMO-1001' });
  if (!existingOrder) {
    const demoOrder = await Order.create({
      buyerId: demoBuyer._id,
      orderNumber: 'AC-DEMO-1001',
      shippingAddress: {
        fullName: 'Maya Buyer',
        line1: '214 Willow Way',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
        phone: '206-555-0188',
      },
      subtotalCents: 6800,
      platformFeeCents: 340,
      totalCents: 6800,
      paymentStatus: 'paid',
      vendorOrders: [
        {
          storeId: store1._id,
          vendorId: demoVendor1._id,
          status: 'Shipped',
          trackingNumber: '1Z999DEMO001',
          subtotalCents: 6800,
          platformFeeCents: 340,
          vendorNetCents: 6460,
          items: [
            {
              productId: prod1._id,
              titleSnapshot: prod1.title,
              imageSnapshot: prod1.images[0].url,
              unitPriceCents: 6800,
              quantity: 1,
              lineTotalCents: 6800,
            },
          ],
        },
      ],
    });

    await VendorPayout.create({
      orderId: demoOrder._id,
      orderNumber: demoOrder.orderNumber,
      storeId: store1._id,
      vendorId: demoVendor1._id,
      grossCents: 6800,
      commissionCents: 340,
      netAmountCents: 6460,
      status: 'recorded',
    });

    await Review.findOneAndUpdate(
      { productId: prod1._id, buyerId: demoBuyer._id },
      {
        productId: prod1._id,
        buyerId: demoBuyer._id,
        orderId: demoOrder._id,
        rating: 5,
        comment:
          'Pours cleanly without dripping and feels substantial in hand. Packed carefully.',
      },
      { upsert: true, new: true }
    );

    prod1.ratingAvg = 5;
    prod1.ratingCount = 1;
    await prod1.save();
  }

  console.log('Seed completed successfully.');
  await disconnectDatabase();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await disconnectDatabase();
  process.exit(1);
});

