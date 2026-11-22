# Artisan's Corner — REST API Documentation

Base URL: `http://localhost:5000/api` (Production: `/api`)

All requests and responses use `Content-Type: application/json` unless handling multipart image uploads.

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Register a new buyer or artisan user.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Collector",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "buyer"
  }
  ```
- **Response**: `201 Created` with user profile and session token.

### `POST /api/auth/login`
Authenticate existing user via email and password with constant-time comparison.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "buyer@artisanscorner.demo",
    "password": "DemoBuyer123!"
  }
  ```
- **Response**: `200 OK` with user details, store (if vendor), and `ac_token` cookie.

### `POST /api/auth/logout`
Terminates user session and clears authentication cookies.
- **Access**: Public
- **Response**: `200 OK`.

### `GET /api/auth/me`
Retrieves currently authenticated user profile and owned store data.
- **Access**: Authenticated (`ac_token` or `Authorization: Bearer <token>`)
- **Response**: `200 OK`.

---

## 2. Artisan Stores (`/api/stores`)

### `GET /api/stores`
List all active approved artisan studios.
- **Access**: Public
- **Response**: `200 OK` with list of stores.

### `GET /api/stores/:slug`
Retrieve studio details and active product listings by store slug.
- **Access**: Public
- **Response**: `200 OK` with store profile and products.

### `POST /api/stores/become-seller`
Onboards an existing user into an artisan vendor with store details and logo upload.
- **Access**: Authenticated
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `name`: string (min 3 chars)
  - `description`: string (min 20 chars)
  - `location`: string (min 2 chars)
  - `logo`: image file (max 5MB, JPEG/PNG/WebP)
- **Response**: `201 Created`.

### `GET /api/stores/me`
Retrieve the current vendor's own studio profile.
- **Access**: Vendor (`requireRole('vendor')`)
- **Response**: `200 OK`.

### `PATCH /api/stores/me`
Update the current vendor's studio information or logo.
- **Access**: Vendor
- **Response**: `200 OK`.

---

## 3. Products & Catalog (`/api/products`)

### `GET /api/products`
Query catalog with filtering, search, sorting, and pagination.
- **Access**: Public
- **Query Parameters**:
  - `category`: string (optional)
  - `search`: string (optional, sanitized for ReDoS)
  - `minPrice`: integer cents (optional)
  - `maxPrice`: integer cents (optional)
  - `sort`: `newest` | `price-asc` | `price-desc` | `rating` (default: `newest`)
  - `page`: integer (default: 1)
  - `limit`: integer (default: 12, max: 48)
- **Response**: `200 OK` with `{ items: Product[], pagination: { page, limit, total, totalPages } }`.

### `GET /api/products/:slug`
Retrieve single product details populated with store information.
- **Access**: Public
- **Response**: `200 OK`.

### `POST /api/products`
Create a new artisan product listing.
- **Access**: Vendor
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `title`: string (min 3 chars)
  - `description`: string (min 20 chars)
  - `priceCents`: integer cents (min 50)
  - `category`: string (one of 7 craft categories)
  - `stock`: integer (min 0)
  - `materials`: string (optional)
  - `images`: up to 5 image files (binary verified)
- **Response**: `201 Created`.

### `PATCH /api/products/:id`
Update an existing product listing.
- **Access**: Vendor (enforces `requireProductOwner`) or Admin
- **Response**: `200 OK`.

### `DELETE /api/products/:id`
Archives or deletes a product listing.
- **Access**: Vendor (enforces `requireProductOwner`) or Admin
- **Response**: `200 OK`.

---

## 4. Product Reviews (`/api/products/:id/reviews`)

### `GET /api/products/:id/reviews`
List all published reviews for a product.
- **Access**: Public
- **Response**: `200 OK` with reviews and reviewer names.

### `GET /api/products/:id/reviews/eligibility`
Check if current authenticated buyer has purchased this item and hasn't reviewed yet.
- **Access**: Authenticated
- **Response**: `200 OK` with `{ canReview: boolean, alreadyReviewed: boolean }`.

### `POST /api/products/:id/reviews`
Submit a verified purchase review. Enforces single review per buyer/product.
- **Access**: Authenticated (Verified Buyer check)
- **Request Body**:
  ```json
  {
    "rating": 5,
    "comment": "Exceptional wheel-thrown pottery. Beautiful glaze texture and balanced weight."
  }
  ```
- **Response**: `201 Created`.

---

## 5. Orders & Cart (`/api/orders`)

### `POST /api/orders/validate-cart`
Authoritative server-side price recalculation, stock availability, and multi-vendor fee computation.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "items": [
      { "productId": "6b030d943883d14ccadfa49b", "quantity": 1 }
    ]
  }
  ```
- **Response**: `200 OK` with validated items, subtotal, platform fee (5%), and total.

### `GET /api/orders/my`
Buyer order history with itemized vendor groupings and tracking info.
- **Access**: Authenticated
- **Response**: `200 OK` with order records.

### `GET /api/orders/:id`
Retrieve details of a single owned order.
- **Access**: Authenticated
- **Response**: `200 OK`.

---

## 6. Payments & Stripe (`/api/payments`)

### `GET /api/payments/config`
Retrieves Stripe configuration state and publishable key.
- **Access**: Public
- **Response**: `200 OK`.

### `POST /api/payments/create-intent`
Validates stock, creates pending order, and initializes a Stripe PaymentIntent.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "items": [{ "productId": "...", "quantity": 1 }],
    "shippingAddress": {
      "fullName": "Maya Buyer",
      "line1": "123 Atelier Way",
      "city": "Portland",
      "state": "OR",
      "postalCode": "97201",
      "country": "US",
      "phone": "+15035550199"
    }
  }
  ```
- **Response**: `201 Created` with `clientSecret`, `paymentIntentId`, and `orderNumber`.

### `POST /api/payments/verify`
Server-side payment verification. Decrements stock atomically, marks order paid, and records 95% net vendor payouts.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "paymentIntentId": "pi_..."
  }
  ```
- **Response**: `200 OK` with finalized order.

---

## 7. Seller Workbench (`/api/seller`)

### `GET /api/seller/analytics`
Real database-aggregated gross revenue, net vendor earnings (95%), 5% platform fees, units sold, and daily sales history.
- **Access**: Vendor
- **Response**: `200 OK`.

### `GET /api/seller/orders`
List of order items requiring studio fulfillment.
- **Access**: Vendor
- **Response**: `200 OK`.

### `PATCH /api/seller/orders/:orderId/status`
Update fulfillment status (`Processing`, `Shipped`) and provide shipment tracking number.
- **Access**: Vendor
- **Request Body**:
  ```json
  {
    "status": "Shipped",
    "trackingNumber": "TRACK-ATELIER-101"
  }
  ```
- **Response**: `200 OK`.

### `GET /api/seller/payouts`
Ledger of recorded 95% net earnings per completed order.
- **Access**: Vendor
- **Response**: `200 OK`.

### `POST /api/seller/payouts/:payoutId/simulate-settle`
Simulate bank transfer settlement for recorded vendor payouts.
- **Access**: Vendor
- **Response**: `200 OK`.

---

## 8. Admin Moderation (`/api/admin`)

### `GET /api/admin/overview`
Platform-wide analytics, GMV, store count, order volume, and system health.
- **Access**: Admin (`requireRole('admin')`)
- **Response**: `200 OK`.

### `GET /api/admin/stores`
List of all artisan studios for platform moderation.
- **Access**: Admin
- **Response**: `200 OK`.

### `PATCH /api/admin/stores/:id/status`
Update studio status (`approved`, `suspended`, `rejected`).
- **Access**: Admin
- **Request Body**: `{ "status": "suspended" }`
- **Response**: `200 OK`.

### `PATCH /api/admin/products/:id/archive`
Delist or archive inappropriate product listings platform-wide.
- **Access**: Admin
- **Response**: `200 OK`.
