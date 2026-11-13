export type UserRole = 'buyer' | 'vendor' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: UserRole[];
  createdAt: string;
}

export interface StoreProfile {
  _id: string;
  ownerId: string | { _id: string; name: string };
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  location: string;
  isActive: boolean;
  createdAt: string;
}

export const PRODUCT_CATEGORIES = [
  'Ceramics & Pottery',
  'Textiles & Weaving',
  'Woodwork',
  'Jewelry & Metalsmithing',
  'Leathercraft',
  'Home & Botanical',
  'Paper & Printmaking',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface PopulatedStoreRef {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  location?: string;
}

export interface Product {
  _id: string;
  storeId: string | PopulatedStoreRef;
  vendorId: string;
  title: string;
  slug: string;
  description: string;
  materials: string;
  category: ProductCategory;
  priceCents: number;
  stock: number;
  images: Array<{ url: string; publicId: string }>;
  ratingAvg: number;
  ratingCount: number;
  isArchived: boolean;
  createdAt: string;
}

export interface PaginatedProductsResponse {
  items: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SellerAnalytics {
  totalGrossCents: number;
  totalPlatformFeeCents: number;
  totalNetEarningsCents: number;
  totalOrders: number;
  totalUnitsSold: number;
  activeProductsCount: number;
  salesHistory: Array<{
    date: string;
    grossCents: number;
    netCents: number;
    orders: number;
  }>;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrderLineItem {
  productId: string;
  titleSnapshot: string;
  imageSnapshot: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface VendorOrderGroup {
  _id: string;
  storeId: string | { _id: string; name: string; slug: string };
  vendorId: string;
  status: 'Processing' | 'Shipped';
  trackingNumber?: string;
  subtotalCents: number;
  platformFeeCents: number;
  vendorNetCents: number;
  items: OrderLineItem[];
}

export interface OrderRecord {
  _id: string;
  orderNumber: string;
  shippingAddress: ShippingAddress;
  subtotalCents: number;
  platformFeeCents: number;
  totalCents: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  vendorOrders: VendorOrderGroup[];
  createdAt: string;
}

export interface VendorPayoutRecord {
  _id: string;
  orderId: string;
  orderNumber: string;
  grossCents: number;
  commissionCents: number;
  netAmountCents: number;
  status: 'recorded' | 'settled_simulated';
  settledAt?: string;
  createdAt: string;
}

export interface ProductReview {
  _id: string;
  productId: string;
  buyerId: { _id: string; name: string } | string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function getStoreRef(product: Product): PopulatedStoreRef | null {
  if (typeof product.storeId === 'object' && product.storeId !== null) {
    return product.storeId;
  }
  return null;
}
