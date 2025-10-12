import { env } from './config/env.js';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';
import { initTelemetry } from './lib/telemetry.js';

const app = createApp();

const port = env.PORT;

if (import.meta.main) {
  initTelemetry().catch((error) => logger.error({ err: error }, 'Telemetry init failed'));

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
