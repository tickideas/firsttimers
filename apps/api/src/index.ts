// File: apps/api/src/index.ts
// Description: API entry point with server initialization and graceful shutdown handling
// Why: Starts the HTTP server and handles cleanup on shutdown for zero-downtime deploys
// RELEVANT FILES: apps/api/src/app.ts, apps/api/src/lib/prisma.ts, apps/api/src/lib/logger.ts

import { env } from './config/env.js';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';
import { initTelemetry } from './lib/telemetry.js';
import { shutdownPrisma } from './lib/prisma.js';

const app = createApp();

const port = env.PORT;

if (import.meta.main) {
  initTelemetry().catch((error) => logger.error({ err: error }, 'Telemetry init failed'));

  const server = Bun.serve({
    port,
    fetch: app.fetch,
    error(error) {
      logger.error({ err: error }, 'Unhandled error');
      return new Response('Internal Server Error', { status: 500 });
    }
  });

  logger.info(`API listening on http://localhost:${port}`);

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully...');

    // Stop accepting new connections
    server.stop();

    // Close database connections
    try {
      await shutdownPrisma();
      logger.info('Database connections closed');
    } catch (err) {
      logger.error({ err }, 'Error closing database connections');
    }

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
