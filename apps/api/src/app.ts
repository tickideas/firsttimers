import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { authenticate } from './middleware/auth.js';
import { tenantIsolation } from './middleware/tenant-isolation.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerPublicFormRoutes } from './routes/forms.js';
import { registerFirstTimerRoutes } from './routes/first-timers.js';
import { registerVerificationRoutes } from './routes/verification.js';
import { registerFollowUpRoutes } from './routes/follow-ups.js';
import { registerFormBuilderRoutes } from './routes/form-builder.js';
import type { AppBindings } from './types/context.js';

export const createApp = () => {
  const app = new Hono<AppBindings>();

  app.use('*', cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));
  app.use('*', secureHeaders());
  app.use('*', logger());
  app.use('*', async (c, next) => {
    c.set('requestId', crypto.randomUUID());
    return next();
  });

  registerPublicFormRoutes(app);
  app.use('*', authenticate);
  app.use('*', tenantIsolation);
  registerAuthRoutes(app);
  registerHealthRoutes(app);
  registerFirstTimerRoutes(app);
  registerVerificationRoutes(app);
  registerFollowUpRoutes(app);
  registerFormBuilderRoutes(app);

  app.get('/', (c) => c.json({ status: 'ok' }));

  return app;
};

export type App = ReturnType<typeof createApp>;
