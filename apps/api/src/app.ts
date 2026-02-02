import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { authenticate } from './middleware/auth.js';
import { tenantIsolation } from './middleware/tenant-isolation.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerPublicFormRoutes } from './routes/forms.js';
import { registerFirstTimerRoutes } from './routes/first-timers.js';
import { registerVerificationRoutes } from './routes/verification.js';
import { registerFollowUpRoutes } from './routes/follow-ups.js';
import { registerFormBuilderRoutes } from './routes/form-builder.js';
import { registerFoundationRoutes } from './routes/foundation.js';
import { registerDepartmentRoutes } from './routes/departments.js';
import type { AppBindings } from './types/context.js';

type WildcardOrigin = {
  scheme: string
  suffix: string
}

const parseCorsOrigins = (origins: string[]) => {
  const exactOrigins = new Set<string>()
  const wildcardOrigins: WildcardOrigin[] = []

  for (const origin of origins) {
    if (!origin) continue;

    if (origin.includes('://*.')) {
      const [scheme, hostPattern] = origin.split('://');
      if (!scheme || !hostPattern?.startsWith('*.')) continue;

      const suffix = hostPattern.slice(2).toLowerCase();
      if (!suffix) continue;

      wildcardOrigins.push({ scheme: scheme.toLowerCase(), suffix })
      continue;
    }

    try {
      const url = new URL(origin)
      exactOrigins.add(url.origin.toLowerCase())
    } catch {
      continue;
    }
  }

  return { exactOrigins, wildcardOrigins }
}

const buildCorsOriginResolver = (origins: string[]) => {
  const { exactOrigins, wildcardOrigins } = parseCorsOrigins(origins)

  return (origin: string) => {
    if (!origin) return null

    let url: URL
    try {
      url = new URL(origin)
    } catch {
      return null
    }

    const normalizedOrigin = url.origin.toLowerCase()
    if (exactOrigins.has(normalizedOrigin)) {
      return origin
    }

    const hostname = url.hostname.toLowerCase()
    const scheme = url.protocol.replace(':', '')

    for (const wildcard of wildcardOrigins) {
      if (scheme !== wildcard.scheme) continue
      if (hostname.endsWith(`.${wildcard.suffix}`)) {
        return origin
      }
    }

    return null
  }
}

const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
]

const configuredCorsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : defaultCorsOrigins

export const createApp = () => {
  const app = new Hono<AppBindings>();

  app.use('*', cors({
    origin: buildCorsOriginResolver(configuredCorsOrigins),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));
  app.use('*', secureHeaders());
  app.use('*', logger());
  app.use('*', async (c, next) => {
    c.set('requestId', crypto.randomUUID());
    c.set('prisma', prisma);
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
  registerFoundationRoutes(app);
  registerDepartmentRoutes(app);

  app.get('/', (c) => c.json({ status: 'ok' }));

  return app;
};

export type App = ReturnType<typeof createApp>;
