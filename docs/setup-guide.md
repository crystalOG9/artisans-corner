# Artisan's Corner — Local Setup & Development Guide

Follow this step-by-step guide to run, test, and develop **Artisan's Corner** locally.

---

## 1. System Requirements

- **Node.js**: v18.0.0 or higher (Node v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas cluster connection URI (or local MongoDB v6.0+ instance)
- **Stripe Account (Optional for local testing)**: Stripe Test Mode keys
- **Cloudinary Account (Optional for local testing)**: Cloudinary credentials for cloud image uploads

---

## 2. Repository Installation

Clone the repository and install dependencies for both the frontend and backend:

```bash
# Clone the repository
git clone https://github.com/crystalOG9/artisans-corner.git
cd artisans-corner

# Install dependencies across all workspaces
npm run install:all
```

---

## 3. Environment Variables Configuration

Copy the example environment files into active `.env` files:

### Backend Configuration (`server/.env`)
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/artisans_corner?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Cloudinary (Required for vendor studio logo & product photo uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Stripe Payments (Test Mode)
STRIPE_SECRET_KEY=your_stripe_test_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
PLATFORM_COMMISSION_BPS=500
```

### Frontend Configuration (`client/.env`)
```bash
cp client/.env.example client/.env
```

Edit `client/.env`:
```ini
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

---

## 4. Database Seeding

Populate the database with curated handmade items across all 7 craft categories and demo accounts:

```bash
npm run seed --prefix server
```

The script will seed:
- 14 artisan products with high-resolution imagery and verified material descriptions.
- 2 approved artisan studios (*Kiln & Birch Studio* and *Loom & Flax Studio*).
- Demo Buyer, Demo Vendor, and Demo Admin accounts.

---

## 5. Starting the Application

Run both the backend and frontend in separate terminals:

```bash
# Terminal 1 — Backend API (Starts on http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend UI (Starts on http://localhost:5173)
cd client
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 6. Seeded Demo Accounts

All seeded accounts use standard passwords for evaluator testing:

| Account Type | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Demo Buyer** | `buyer@artisanscorner.demo` | `DemoBuyer123!` | Browse catalog, multi-vendor cart, Stripe checkout, order history, verified reviews |
| **Artisan Vendor 1** | `vendor@artisanscorner.demo` | `DemoVendor123!` | Kiln & Birch Studio (Ceramics & Woodwork), sales analytics, order fulfillment, payout ledger |
| **Artisan Vendor 2** | `weaver@artisanscorner.demo` | `DemoVendor123!` | Loom & Flax Studio (Textiles & Prints), sales analytics, dispatch tracking |
| **Demo Admin** | `admin@artisanscorner.demo` | `DemoAdmin123!` | Platform analytics, store status moderation, product catalog audit |

---

## 7. Running Tests & Quality Verification

```bash
# Run backend test suite (14/14 Vitest tests)
npm test --prefix server

# Strict TypeScript typechecking
npm run typecheck --prefix server
npm run typecheck --prefix client

# Frontend production build verification
npm run build --prefix client
```
