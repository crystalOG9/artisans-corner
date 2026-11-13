import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { stripeWebhookHandler } from './controllers/paymentController';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

export function createApp() {
  const app = express();

  app.use(helmet());

  const allowedOrigins = env.CLIENT_URL.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
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
    app.use(
      '/api/auth',
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
  }

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api', apiRoutes);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
  });

  app.use(errorHandler);

  return app;
}
