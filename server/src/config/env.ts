import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load from current working dir or explicit server directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const DEFAULT_MONGODB_URI =
  'mongodb+srv://pawarpiyush172_db_user:Artisan1234@cluster0.ddnl5ow.mongodb.net/artisans_corner?retryWrites=true&w=majority';
const DEFAULT_JWT_SECRET =
  '8381f992020be8128159e2c160f638bddc709deede58cd96ddda519d6bd22b98';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1).default(process.env.MONGODB_URI || DEFAULT_MONGODB_URI),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default(process.env.JWT_SECRET || DEFAULT_JWT_SECRET),
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
      NODE_ENV: (process.env.NODE_ENV as any) || 'production',
      PORT: parseInt(process.env.PORT || '5000', 10),
      MONGODB_URI: process.env.MONGODB_URI || DEFAULT_MONGODB_URI,
      JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
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
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in server/.env to start the API server.');
  }
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 16) {
    throw new Error('JWT_SECRET (min 16 characters) is required in server/.env.');
  }
}

