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

  // Clean old/temporary products, reviews, and test orders
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Review.deleteMany({});
  await VendorPayout.deleteMany({});

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
        'Small-batch stoneware pottery wheel-thrown and wood-fired in Portland, Oregon. Dedicated to functional beauty and heirloom tea wares.',
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
        'Handwoven organic European linen table runners, heirloom blankets, and hand-bound leather studio notebooks.',
      location: 'Burlington, VT',
      logoUrl:
        'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=400&q=80',
      logoPublicId: 'seed/loom-flax-logo',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  // ALL 7 CATEGORIES WITH CURATED ARTISAN CREATIONS
  const catalogProducts = [
    // 1. Ceramics & Pottery
    {
      storeId: store1._id,
      vendorId: demoVendor1._id,
      title: 'Speckled Stoneware Pour-Over Carafe',
      slug: 'speckled-stoneware-pour-over-carafe',
      description:
        'Wheel-thrown stoneware pour-over set finished with a satin ash glaze. Holds 500 ml and fits standard #2 paper filters. Every piece carries unique mineral speckles from the wood kiln firing.',
      materials: 'Speckled stoneware clay, food-safe matte ash glaze',
      category: 'Ceramics & Pottery' as const,
      priceCents: 6800,
      stock: 8,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/stoneware-carafe',
        },
      ],
      ratingAvg: 5,
      ratingCount: 1,
    },
    {
      storeId: store1._id,
      vendorId: demoVendor1._id,
      title: 'Matte Celadon Matcha Chawan Bowl',
      slug: 'matte-celadon-matcha-chawan-bowl',
      description:
        'Hand-trimmed ceramic chawan with an ergonomic foot ring and warm celadon interior. Flared rim allows effortless whisking with traditional bamboo chasen.',
      materials: 'Buff stoneware, natural iron-fluxed celadon glaze',
      category: 'Ceramics & Pottery' as const,
      priceCents: 5400,
      stock: 6,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/celadon-bowl',
        },
      ],
      ratingAvg: 5,
      ratingCount: 1,
    },

    // 2. Textiles & Weaving
    {
      storeId: store2._id,
      vendorId: demoVendor2._id,
      title: 'Handwoven European Flax Table Runner',
      slug: 'handwoven-european-flax-table-runner',
      description:
        'Woven on a four-harness floor loom using unbleached European flax linen with hand-knotted fringe. Softens with every wash and will last generations.',
      materials: '100% European flax linen, hand-knotted fringe',
      category: 'Textiles & Weaving' as const,
      priceCents: 10000,
      stock: 5,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/flax-runner',
        },
      ],
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      storeId: store2._id,
      vendorId: demoVendor2._id,
      title: 'Waffle-Weave Organic Cotton Studio Throw',
      slug: 'waffle-weave-organic-cotton-studio-throw',
      description:
        'Deep waffle weave loomed from GOTS-certified organic cotton. Lightweight yet exceptionally warm with raw selvedge edges.',
      materials: '100% Organic certified cotton, unbleached yarns',
      category: 'Textiles & Weaving' as const,
      priceCents: 14500,
      stock: 4,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/waffle-throw',
        },
      ],
      ratingAvg: 0,
      ratingCount: 0,
    },

    // 3. Woodwork
    {
      storeId: store1._id,
      vendorId: demoVendor1._id,
      title: 'End-Grain Black Walnut Cutting Board',
      slug: 'end-grain-black-walnut-cutting-board',
      description:
        'Crafted from sustainably salvaged American black walnut. End-grain orientation protects knife edges while self-healing from knife cuts. Conditioned with organic beeswax and food-grade mineral oil.',
      materials: 'American black walnut, beeswax & food-grade mineral oil',
      category: 'Woodwork' as const,
      priceCents: 12000,
      stock: 3,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/walnut-board',
        },
      ],
      ratingAvg: 5,
      ratingCount: 2,
    },
    {
      storeId: store1._id,
      vendorId: demoVendor1._id,
      title: 'Hand-Carved Cherry Wood Serving Spoons',
      slug: 'hand-carved-cherry-wood-serving-spoons',
      description:
        'Set of two serving spoons hand-adzed and gouged from fallen Pennsylvania wild cherry wood. Polished smooth with organic walnut oil finish.',
      materials: 'Wild cherry wood, organic cold-pressed walnut oil',
      category: 'Woodwork' as const,
      priceCents: 4600,
      stock: 7,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/cherry-spoons',
        },
      ],
      ratingAvg: 0,
      ratingCount: 0,
    },

    // 4. Jewelry & Metalsmithing
    {
      storeId: store2._id,
      vendorId: demoVendor2._id,
      title: 'Forged Brass Botanical Pendant',
      slug: 'forged-brass-botanical-pendant',
      description:
        'Hand-forged from recycled solid brass with delicate hammered leaf textures and an antiqued oxidized finish. Suspended on a 20-inch natural leather cord.',
      materials: 'Solid recycled brass, oxidized antique patina, leather cord',
      category: 'Jewelry & Metalsmithing' as const,
      priceCents: 7800,
      stock: 5,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/brass-pendant',
        },
      ],
      ratingAvg: 5,
      ratingCount: 1,
    },
    {
      storeId: store2._id,
      vendorId: demoVendor2._id,
      title: 'Hammered Sterling Silver Studio Band',
      slug: 'hammered-sterling-silver-studio-band',
      description:
        'Handcrafted from 925 sterling silver with a distinctive faceted hammer texture that catches light from all angles. Comfort-fit interior.',
      materials: '925 Sterling silver, hand-hammered finish',
      category: 'Jewelry & Metalsmithing' as const,
      priceCents: 6500,
      stock: 9,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/silver-band',
        },
      ],
      ratingAvg: 0,
      ratingCount: 0,
    },

    // 5. Leathercraft
    {
      storeId: store2._id,
      vendorId: demoVendor2._id,
      title: 'Vegetable-Tanned Saddle Leather Journal',
      slug: 'vegetable-tanned-saddle-leather-journal',
      description:
        'Constructed from 5oz full-grain Tuscan vegetable-tanned leather that patinas to a rich amber tone over time. Refillable notebook bound with heavy waxed linen thread.',
      materials: 'Full-grain vegetable-tanned leather, waxed linen thread, unlined paper',
      category: 'Leathercraft' as const,
      priceCents: 8200,
      stock: 4,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/leather-journal',
        },
      ],
      ratingAvg: 5,
      ratingCount: 3,
    },
    {
      storeId: store2._id,
      vendorId: demoVendor2._id,
      title: 'Hand-Stitched Minimalist Card Wallet',
      slug: 'hand-stitched-minimalist-card-wallet',
      description:
        'Slim profile wallet with four card slots and center cash pocket. Saddle-stitched entirely by hand for unbeatable seam strength.',
      materials: 'Wickett & Craig vegetable-tanned bridle leather, burnished beeswax edges',
      category: 'Leathercraft' as const,
      priceCents: 4800,
      stock: 6,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/leather-wallet',
        },
      ],
      ratingAvg: 0,
      ratingCount: 0,
    },

    // 6. Home & Botanical
    {
      storeId: store1._id,
      vendorId: demoVendor1._id,
      title: 'Hand-Poured Beeswax Pillar Candle Duo',
      slug: 'hand-poured-beeswax-pillar-candle-duo',
      description:
        'Crafted from 100% pure unfiltered Pacific Northwest beeswax and unbleached cotton wicks. Emits a warm golden light with natural subtle honey fragrance.',
      materials: '100% Unfiltered pure beeswax, raw cotton braided wick',
      category: 'Home & Botanical' as const,
      priceCents: 3800,
      stock: 12,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/beeswax-candles',
        },
      ],
      ratingAvg: 5,
      ratingCount: 1,
    },
    {
      storeId: store1._id,
      vendorId: demoVendor1._id,
      title: 'Limestone & Brass Incense Burner Vessel',
      slug: 'limestone-and-brass-incense-burner-vessel',
      description:
        'Sculptural burner carved from solid porous limestone with an unlacquered solid brass stick holder that will develop an organic studio patina.',
      materials: 'Natural carved limestone, solid brass insert',
      category: 'Home & Botanical' as const,
      priceCents: 5200,
      stock: 5,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/incense-vessel',
        },
      ],
      ratingAvg: 0,
      ratingCount: 0,
    },

    // 7. Paper & Printmaking
    {
      storeId: store2._id,
      vendorId: demoVendor2._id,
      title: 'Hand-Pressed Botanical Woodblock Print',
      slug: 'hand-pressed-botanical-woodblock-print',
      description:
        'Limited edition of 50 prints pulled on a vintage manual Vandercook proof press using archival French paper and oil-based relief ink. Numbered and signed by the printmaker.',
      materials: 'Archival French cotton rag paper, Cranfield oil-based relief ink',
      category: 'Paper & Printmaking' as const,
      priceCents: 6400,
      stock: 10,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/woodblock-print',
        },
      ],
      ratingAvg: 5,
      ratingCount: 2,
    },
    {
      storeId: store2._id,
      vendorId: demoVendor2._id,
      title: 'Letterpress Studio Notebook Trio',
      slug: 'letterpress-studio-notebook-trio',
      description:
        'Set of three sewn-bound pocket notebooks featuring blind-debossed kraft covers printed on an antique 1890s Chandler & Price letterpress. 60 blank pages of 80lb text paper.',
      materials: 'Recycled kraft chipboard, 80lb text paper, natural linen thread binding',
      category: 'Paper & Printmaking' as const,
      priceCents: 3200,
      stock: 15,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=900&q=80',
          publicId: 'seed/letterpress-notebooks',
        },
      ],
      ratingAvg: 0,
      ratingCount: 0,
    },
  ];

  const createdProducts = [];
  for (const item of catalogProducts) {
    const p = await Product.create({
      ...item,
      isArchived: false,
    });
    createdProducts.push(p);
  }

  // Create verified sample order with Carafe
  const firstProd = createdProducts[0];
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
            productId: firstProd._id,
            titleSnapshot: firstProd.title,
            imageSnapshot: firstProd.images[0].url,
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

  await Review.create({
    productId: firstProd._id,
    buyerId: demoBuyer._id,
    orderId: demoOrder._id,
    rating: 5,
    comment:
      'Pours cleanly without dripping and feels substantial in hand. Packed with recycled paper in an authentic studio box.',
  });

  console.log(`Seed completed successfully! Inserted ${createdProducts.length} curated handmade pieces across all 7 craft categories.`);
  await disconnectDatabase();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await disconnectDatabase();
  process.exit(1);
});
