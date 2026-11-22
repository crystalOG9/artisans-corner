# Artisan's Corner — System Architecture & Technical Design

This document details the software architecture, data models, integration patterns, and security topology of **Artisan's Corner**, a production-grade multi-vendor handmade marketplace built for the Persevex Web Development Internship.

---

## 1. High-Level Architecture Overview

Artisan's Corner is architected as a decoupled client-server web application adhering to the **Separation of Concerns (SoC)** and **Layered Architecture** principles:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                            │
│           React 18 · Vite · Redux Toolkit · Tailwind CSS · Three.js    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS / JSON REST API
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           EXPRESS REST API                             │
│       Routes ➔ Middleware ➔ Controllers ➔ Services ➔ Validators        │
└───────┬────────────────────────────┬────────────────────────────┬──────┘
        │                            │                            │
        ▼                            ▼                            ▼
┌──────────────────┐       ┌──────────────────┐        ┌─────────────────┐
│  MongoDB Atlas   │       │   Stripe API     │        │  Cloudinary CDN │
│ Mongoose Schemas │       │  PaymentIntents  │        │   Media Storage │
└──────────────────┘       └──────────────────┘        └─────────────────┘
```

---

## 2. Frontend Architecture (`client/`)

- **Runtime & Bundler**: React 18 with Vite 6 for rapid HMR in development and optimized Rollup tree-shaken ESM builds in production.
- **State Management**:
  - **Redux Toolkit**: Centralized store for authentication (`authSlice.ts`) and client-side shopping cart (`cartSlice.ts`) with automatic `localStorage` synchronization.
  - **React Context**: Lightweight `ToastContext` providing non-blocking feedback across user flows.
- **Styling System**:
  - Tailored **Editorial Atelier Design Tokens** (`styles/tokens.css`) emphasizing tactile linen tones (`#FAF7F2`), terracotta accents (`#C85A32`), artisan sage (`#4A6B5D`), and rich walnut typography.
  - Expressive serif headers powered by Google Fonts *Fraunces*.
- **3D Interactive Experience**:
  - Bespoke procedural clay pottery wheel animation using `three.js` (`ThreeLoadingScreen.tsx`).
  - Cached in `sessionStorage` (`artisan_loader_seen`) to display once per browsing session, with automatic WebGL detection fallback.
- **Routing & Navigation**:
  - React Router DOM v6 with route-level security guards (`ProtectedRoute.tsx`) supporting role checking (`buyer`, `vendor`, `admin`).

---

## 3. Backend Architecture (`server/`)

The backend follows an enterprise **Controller-Service-Model** architectural pattern:

```
Request ➔ Rate Limiter / Helmet ➔ Router ➔ Authenticate / Authorize ➔ Validate (Zod)
        ➔ Controller (Req/Res orchestration) ➔ Service (Business Logic)
        ➔ Mongoose Model ➔ MongoDB Atlas
```

### Layer Responsibilities:
1. **Config (`src/config/`)**:
   - Environment schema validation via Zod (`env.ts`).
   - Database connection management with connection pooling (`db.ts`).
   - Cloudinary and Stripe API initialization (`cloudinary.ts`, `stripe.ts`).
2. **Middleware (`src/middleware/`)**:
   - `authenticate.ts`: Extracts JWT from HTTP-only cookie `ac_token` or `Authorization: Bearer <token>`.
   - `authorize.ts`: Enforces role-based permissions (`buyer`, `vendor`, `admin`).
   - `ownership.ts`: Strictly validates that vendors can only alter their own products (`requireProductOwner`).
   - `upload.ts`: Memory-buffered file handling with binary magic-byte inspection (`imageUpload`).
   - `validate.ts`: Zod schema request validation before reaching controller handlers.
   - `errorHandler.ts`: Centralized, normalized error responses with stack traces hidden in production.
3. **Controllers (`src/controllers/`)**:
   - HTTP transport handlers that parse params/body, invoke services, and return typed JSON responses.
4. **Services (`src/services/`)**:
   - Pure domain business logic: stock allocation, payment verification, payout ledgers, order generation, and catalog queries.
5. **Models (`src/models/`)**:
   - Strongly-typed Mongoose schemas with compound indexes, virtuals, and sanitizing `toJSON` transforms.

---

## 4. Database Schema & Data Relationships

```
┌──────────┐ 1        1 ┌──────────┐ 1        * ┌──────────┐
│   User   ├───────────►│  Store   ├───────────►│ Product  │
└────┬─────┘            └──────────┘            └────┬─────┘
     │ 1                                             │ 1
     │                                               │
     │ *                                             │ *
┌────▼─────┐ 1        * ┌──────────────┐        ┌────▼─────┐
│  Order   ├───────────►│ VendorPayout │        │  Review  │
└──────────┘            └──────────────┘        └──────────┘
```

- **User**: Authentication credentials, role array (`['buyer']`, `['buyer', 'vendor']`, `['buyer', 'admin']`).
- **Store**: Maker studio entity (`ownerId -> User._id`, unique `slug`, logo, location, story).
- **Product**: Maker craft items (`vendorId -> User._id`, `storeId -> Store._id`, price in integer cents, small-batch stock count, materials, category).
- **Order**: Multi-vendor purchase record (`buyerId -> User._id`, shipping address, purchase-time product title and price snapshots, itemized per-vendor groups).
- **VendorPayout**: Immutable platform ledger record allocating 95% net payout to the artisan and 5% fee to the platform.
- **Review**: Verified-purchase feedback (`productId -> Product._id`, `buyerId -> User._id`, compound unique index enforcing 1 review per buyer/product).

---

## 5. Security & Reliability Architecture

1. **Atomic Inventory Decrements with Rollback**:
   - Inventory decrements execute atomically via `$inc: { stock: -qty }` under `{ stock: { $gte: qty } }`.
   - If any item in a multi-item order fails, a compensatory loop immediately restores previously decremented units.
2. **Buffer Magic-Byte File Validation**:
   - Uploaded files are inspected for authentic binary magic-byte signatures (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`), neutralizing disguised executable payloads.
3. **Timing-Attack Resistant Sign-In**:
   - Unregistered email lookups trigger a constant-time dummy bcrypt comparison against a pre-computed hash, preventing timing-based email enumeration.
4. **ReDoS Sanitization**:
   - Public catalog search terms are length-capped and escaped of all regular expression metacharacters before executing MongoDB regex queries.
5. **Strict Multi-Tier Rate Limiting**:
   - Distinct rate limit buckets for Authentication (`15 req / 15 min`), PaymentIntents (`15 req / 15 min`), and General API routes (`300 req / 15 min`).
