import { createApp } from './app';
import { connectDatabase } from './config/db';
import { assertServerEnv, env } from './config/env';

async function bootstrap(): Promise<void> {
  assertServerEnv();
  await connectDatabase(env.MONGODB_URI!);
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Artisan's Corner API listening on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

