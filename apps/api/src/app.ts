import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { authenticate } from './middleware/auth.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';
import type { AppBindings } from './types/context.js';

export const createApp = () => {
  const app = new Hono<AppBindings>();

  app.use('*', secureHeaders());
  app.use('*', logger());
  app.use('*', async (c, next) => {
    c.set('requestId', crypto.randomUUID());
    return next();
  });
  app.use('*', authenticate);

  registerAuthRoutes(app);
  registerHealthRoutes(app);

  app.get('/', (c) => c.json({ status: 'ok' }));

  return app;
};

export type App = ReturnType<typeof createApp>;
