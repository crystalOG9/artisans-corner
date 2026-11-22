import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load from current working dir or explicit server directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

const isTest = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .default(isTest ? 'mongodb://localhost:27017/test_db' : (process.env.MONGODB_URI || '')),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default(isTest ? 'test-jwt-secret-for-vitest-suite-32chars' : (process.env.JWT_SECRET || '')),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default(process.env.CLIENT_URL || '*'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  PLATFORM_COMMISSION_BPS: z.coerce.number().int().min(0).max(5000).default(500),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('Environment validation warning:', parsed.error.flatten().fieldErrors);
}

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      PORT: parseInt(process.env.PORT || '5000', 10),
      MONGODB_URI: process.env.MONGODB_URI || (isTest ? 'mongodb://localhost:27017/test_db' : ''),
      JWT_SECRET: process.env.JWT_SECRET || (isTest ? 'test-jwt-secret-for-vitest-suite-32chars' : ''),
      JWT_EXPIRES_IN: '7d',
      CLIENT_URL: process.env.CLIENT_URL || '*',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      PLATFORM_COMMISSION_BPS: 500,
    };

export function assertServerEnv(): void {
  if (!env.MONGODB_URI && env.NODE_ENV !== 'test') {
    throw new Error('MONGODB_URI is required in server/.env to start the API server.');
  }
  if ((!env.JWT_SECRET || env.JWT_SECRET.length < 16) && env.NODE_ENV !== 'test') {
    throw new Error('JWT_SECRET (min 16 characters) is required in server/.env.');
  }
}

