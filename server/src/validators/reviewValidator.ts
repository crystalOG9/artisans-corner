import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z
      .string()
      .trim()
      .min(5, 'Review must be at least 5 characters')
      .max(1000, 'Review must be 1000 characters or fewer'),
  }),
});

