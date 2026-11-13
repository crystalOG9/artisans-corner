import { z } from 'zod';

export const becomeSellerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Store name must be at least 2 characters')
      .max(80, 'Store name must be 80 characters or fewer'),
    description: z
      .string()
      .trim()
      .min(10, 'Store description must be at least 10 characters')
      .max(1000, 'Store description must be 1000 characters or fewer'),
    location: z.string().trim().max(100).optional().default(''),
  }),
});

export const updateStoreSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().min(10).max(1000).optional(),
    location: z.string().trim().max(100).optional(),
  }),
});

