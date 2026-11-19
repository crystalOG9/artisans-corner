import { createApp } from './app';
import { connectDatabase } from './config/db';
import { assertServerEnv, env } from './config/env';

const app = createApp();

let isConnected = false;
async function ensureDbConnected() {
  if (!isConnected && env.MONGODB_URI) {
    try {
      await connectDatabase(env.MONGODB_URI);
      isConnected = true;
    } catch (err) {
      console.error('Database connection error in Express service:', err);
    }
  }
}

// Middleware to ensure DB is connected for serverless invocations
app.use(async (_req, _res, next) => {
  await ensureDbConnected();
  next();
});

async function bootstrap(): Promise<void> {
  assertServerEnv();
  await ensureDbConnected();
  app.listen(env.PORT, () => {
    console.log(`Artisan's Corner API listening on port ${env.PORT}`);
  });
}

// Only start listening if executed directly or in standalone mode (not serverless/Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
export { app };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  (module.exports as any).default = app;
  (module.exports as any).app = app;
}


