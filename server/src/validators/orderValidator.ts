import { z } from 'zod';

export const cartItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().min(1).max(50),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(100),
  line1: z.string().trim().min(4, 'Street address is required').max(150),
  line2: z.string().trim().max(150).optional().default(''),
  city: z.string().trim().min(2, 'City is required').max(80),
  state: z.string().trim().min(2, 'State / Region is required').max(80),
  postalCode: z.string().trim().min(3, 'Postal code is required').max(20),
  country: z.string().trim().min(2, 'Country is required').max(80),
  phone: z.string().trim().min(6, 'Phone number is required').max(30),
});

export const validateCartSchema = z.object({
  body: z.object({
    items: z.array(cartItemInputSchema).min(1, 'Your cart is empty'),
  }),
});

export const createPaymentIntentSchema = z.object({
  body: z.object({
    items: z.array(cartItemInputSchema).min(1, 'Your cart is empty'),
    shippingAddress: shippingAddressSchema,
  }),
});

export const updateVendorOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Processing', 'Shipped']),
    trackingNumber: z.string().trim().max(80).optional().default(''),
  }),
});

