import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '../models/Product';

export const createProductSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, 'Product title must be at least 3 characters')
      .max(120, 'Product title must be 120 characters or fewer'),
    description: z
      .string()
      .trim()
      .min(15, 'Description must be at least 15 characters')
      .max(2500),
    materials: z.string().trim().max(250).optional().default(''),
    category: z.enum(PRODUCT_CATEGORIES, {
      errorMap: () => ({ message: 'Please select a valid handmade category' }),
    }),
    price: z.coerce
      .number({ invalid_type_error: 'Price must be a valid number' })
      .min(1, 'Price must be at least $1.00')
      .max(100000, 'Price cannot exceed $100,000'),
    stock: z.coerce
      .number({ invalid_type_error: 'Stock must be a whole number' })
      .int('Stock must be a whole number')
      .min(0, 'Stock cannot be negative')
      .max(10000),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(15).max(2500).optional(),
    materials: z.string().trim().max(250).optional(),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    price: z.coerce.number().min(1).max(100000).optional(),
    stock: z.coerce.number().int().min(0).max(10000).optional(),
    isArchived: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  }),
});

