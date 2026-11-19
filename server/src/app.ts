import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { stripeWebhookHandler } from './controllers/paymentController';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

export function createApp() {
  const app = express();

  const allowedOrigins = env.CLIENT_URL.split(',').map((o) => o.trim());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://res.cloudinary.com',
            'https://images.unsplash.com',
          ],
          connectSrc: ["'self'", 'https://api.stripe.com', ...allowedOrigins],
          frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );

  // Stripe webhook requires raw body before express.json()
  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    stripeWebhookHandler
  );

  if (env.NODE_ENV !== 'test') {
    // General API rate limiter
    app.use(
      '/api',
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Too many requests. Please try again later.',
        },
      })
    );

    // Strict rate limiter for authentication endpoints (anti-brute-force)
    app.use(
      ['/api/auth/login', '/api/auth/register'],
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 15,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Too many authentication attempts. Please wait 15 minutes.',
        },
      })
    );

    // Strict rate limiter for payment intent creation (anti-card-testing)
    app.use(
      '/api/payments/create-intent',
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 15,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Payment attempt limit reached. Please wait a few minutes.',
        },
      })
    );
  }

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    '/images',
    express.static(path.join(__dirname, '../../client/public/images'), {
      maxAge: '1d',
    })
  );

  app.use('/api', apiRoutes);
  app.use(apiRoutes);

  // Serve production client build if available
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/images')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ success: false, message: 'Route not found.' });
    } else {
      res.status(404).send('Page not found');
    }
  });

  app.use(errorHandler);

  return app;
}
