import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';

const app = createApp();
let isConnected = false;

export default async function handler(req: any, res: any) {
  // Always set CORS/header safety for serverless
  if (!isConnected && env.MONGODB_URI) {
    try {
      await connectDatabase(env.MONGODB_URI);
      isConnected = true;
    } catch (dbErr: any) {
      console.error('Database connection failed in serverless function:', dbErr);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please check MONGODB_URI.',
        error: dbErr.message || String(dbErr),
      });
    }
  }

  return app(req, res);
}
