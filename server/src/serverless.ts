import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';

const app = createApp();
let isConnected = false;

async function handler(req: any, res: any) {
  try {
    // In Vercel serverless rewrites, resolve the actual requested path
    const matchedPath =
      req.headers['x-matched-path'] ||
      req.headers['x-vercel-matched-path'] ||
      req.originalUrl;

    if (matchedPath && matchedPath !== '/api') {
      req.url = matchedPath.startsWith('/api')
        ? matchedPath
        : '/api' + (matchedPath.startsWith('/') ? matchedPath : '/' + matchedPath);
    } else if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/images')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }

    if (!isConnected && env.MONGODB_URI) {
      try {
        await connectDatabase(env.MONGODB_URI);
        isConnected = true;
      } catch (dbErr: any) {
        console.error('Database connection failed in serverless handler:', dbErr);
        if (!res.headersSent) {
          return res.status(503).json({
            success: false,
            message: 'Database connection failed. Please check MONGODB_URI.',
            error: dbErr.message || String(dbErr),
          });
        }
      }
    }

    return app(req, res);
  } catch (err: any) {
    console.error('Unhandled serverless error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error in serverless handler',
        error: err.message || String(err),
      });
    }
  }
}

export default handler;
