# apps/api - Hono REST API

Hono + TypeScript REST API with JWT auth, Prisma ORM, and tenant isolation.

## Setup & Run

```bash
# From repo root
bun install

# Dev server (runs on :3001 via turbo, with pino-pretty logs)
bun run dev

# Or directly
cd apps/api && bun run dev

# Build
bun run build

# Tests
bun run test
bun run test:watch
bun run test:coverage

# Typecheck
bun run typecheck

# Lint
bun run lint
```

## Patterns & Conventions

### File Organization

```
src/
├── index.ts           # Entry point, server bootstrap
├── app.ts             # Hono app factory, middleware stack
├── config/
│   └── env.ts         # Environment validation
├── middleware/
│   ├── auth.ts        # JWT authentication
│   └── tenant-isolation.ts  # Multi-tenancy
├── routes/
│   ├── auth.ts        # Login/logout
│   ├── health.ts      # Health checks
│   ├── forms.ts       # Public form submissions
│   ├── first-timers.ts
│   ├── verification.ts
│   ├── follow-ups.ts
│   ├── form-builder.ts
│   ├── foundation.ts
│   └── departments.ts
├── services/
│   └── jwt.ts         # Token signing/verification
├── lib/
│   ├── logger.ts      # Pino logger
│   ├── prisma.ts      # Database client
│   └── telemetry.ts   # OpenTelemetry/Sentry
├── types/
│   └── context.ts     # Hono context types
└── utils/
    └── password.ts    # bcrypt helpers
```

### Route Patterns

- **DO**: Export a `register*Routes` function
  ```ts
  // routes/users.ts
  export const registerUserRoutes = (app: App) => {
    app.get('/users', async (c) => { ... });
    app.post('/users', zValidator('json', schema), async (c) => { ... });
  };
  ```
  - Example: `routes/auth.ts`

- **DO**: Use Zod validation for all inputs
  ```ts
  import { zValidator } from '@hono/zod-validator';
  import { z } from 'zod';
  
  const schema = z.object({ email: z.string().email() });
  app.post('/endpoint', zValidator('json', schema), handler);
  ```

- **DO**: Return consistent JSON responses
  ```ts
  return c.json({ data: result });      // Success
  return c.json({ message: 'Error' }, 400);  // Error
  ```

### Authentication

- Public routes: Register before `authenticate` middleware
  - Example: `registerPublicFormRoutes(app)` in `app.ts`
- Protected routes: After `authenticate` + `tenantIsolation`
  - Access user via `c.get('authUser')`
  - Example: `routes/first-timers.ts`

### Database Access

- Access Prisma via context: `const prisma = c.get('prisma')`
- All queries must include `tenantId` filter (enforced by RLS + middleware)
- Use transactions for multi-step operations

### Error Handling

- Use `c.json({ message: '...' }, status)` for expected errors
- Unexpected errors bubble to Bun.serve error handler
- Always log errors with context: `logger.error({ err, requestId }, 'message')`

## Key Files

| File | Purpose |
|------|---------|
| `app.ts` | Middleware stack, route registration |
| `middleware/auth.ts` | JWT verification, `requireRoles()` |
| `middleware/tenant-isolation.ts` | Sets up Prisma with RLS |
| `routes/auth.ts` | Login flow, token issuance |
| `routes/forms.ts` | Public form submission (no auth) |
| `lib/prisma.ts` | Prisma client singleton |
| `types/context.ts` | AppBindings type |

## JIT Index

```bash
# Find route handler
rg "register.*Routes" src/routes --type ts

# Find middleware
rg "export (async )?function" src/middleware --type ts

# Find Zod schema
rg "z\.(object|enum|string|number)" src --type ts

# Find service
rg "export (async )?function" src/services --type ts
```

## Common Gotchas

- **CORS**: Configured via `CORS_ORIGINS` env var (comma-separated)
- **Public routes** must be registered BEFORE `authenticate` middleware
- **Always use `c.get('prisma')`** not direct Prisma import (for RLS)
- **JWT tokens**: Access token short-lived, refresh token in httpOnly cookie
- **Request ID**: Available on all contexts for tracing

## Pre-PR Checks

```bash
cd apps/api && bun run typecheck && bun run test && bun run lint
```

## Environment Variables

See `.env.example` in repo root:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - For BullMQ queues
- `JWT_SECRET` - Token signing
- `CORS_ORIGINS` - Allowed origins (comma-separated)
