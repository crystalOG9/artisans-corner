import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load from current working dir or explicit server directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1).optional(),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default(process.env.NODE_ENV === 'test' ? 'test-jwt-secret-key-for-vitest-only' : ''),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  PLATFORM_COMMISSION_BPS: z.coerce.number().int().min(0).max(5000).default(500),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export function assertServerEnv(): void {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in server/.env to start the API server.');
  }
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 16) {
    throw new Error('JWT_SECRET (min 16 characters) is required in server/.env.');
  }
}

