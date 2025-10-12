import type { App } from '../app.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

export const registerHealthRoutes = (app: App) => {
  app.get('/health', async (c) => {
    let dbHealthy = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch (error) {
      logger.error({ err: error }, 'Database health check failed');
    }

    return c.json({
      status: dbHealthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy
      }
    });
  });
};
