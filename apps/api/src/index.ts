import { env } from './config/env.js';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';
import { initTelemetry } from './lib/telemetry.js';

const app = createApp();

const port = env.PORT;

if (import.meta.main) {
  initTelemetry().catch((error) => logger.error({ err: error }, 'Telemetry init failed'));

  // Log database connection info (mask password)
  const dbUrl = new URL(env.DATABASE_URL);
  logger.info({
    dbHost: dbUrl.hostname,
    dbPort: dbUrl.port,
    dbName: dbUrl.pathname.slice(1),
    dbUser: dbUrl.username
  }, 'Database connection config');

  Bun.serve({
    port,
    fetch: app.fetch,
    error(error) {
      logger.error({ err: error }, 'Unhandled error');
      return new Response('Internal Server Error', { status: 500 });
    }
  });

  logger.info(`API listening on http://localhost:${port}`);
}

export default app;
