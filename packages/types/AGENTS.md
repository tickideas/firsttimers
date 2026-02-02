# packages/types - Shared Zod Schemas

Shared TypeScript types and Zod schemas used across all apps.

## Setup & Build

```bash
# From repo root
bun install

# Dev (watch mode with tsup)
bun run dev

# Build (generates dist/index.js + dist/index.d.ts)
bun run build

# Typecheck
bun run typecheck

# Lint
bun run lint
```

## Patterns & Conventions

### File Organization

```
src/
└── index.ts           # All exports (single entry point)
```

### Schema Patterns

- **DO**: Export both schema and inferred type
  ```ts
  export const UserSchema = z.object({
    id: z.string().cuid2(),
    email: z.string().email(),
  });
  export type User = z.infer<typeof UserSchema>;
  ```

- **DO**: Use Zod enums for string unions
  ```ts
  export const StatusSchema = z.enum(['NEW', 'ACTIVE', 'ARCHIVED']);
  export type Status = z.infer<typeof StatusSchema>;
  ```

- **DO**: Reuse schemas for API validation
  ```ts
  // In API route
  import { UserSchema } from '@firsttimers/types';
  app.post('/users', zValidator('json', UserSchema), handler);
  ```

### Type Patterns

- **DO**: Export minimal types needed by consumers
- **DO**: Use `cuid2()` for ID validation (matches Prisma)
- **DO**: Use `.email()` for email validation
- **DO**: Use E.164 format for phone numbers: `z.string().regex(/^\+/)`

## Key Exports

| Export | Purpose |
|--------|---------|
| `TenantModeSchema` / `TenantMode` | Zone vs Standalone tenant |
| `PipelineStageSchema` / `PipelineStage` | First-timer pipeline stages |
| `MinimalFirstTimerSchema` / `MinimalFirstTimer` | Core first-timer type |
| `RoleKeySchema` / `RoleKey` | RBAC role keys |

## JIT Index

```bash
# Find schema definition
rg "export const.*Schema" src/index.ts

# Find type definition
rg "export type" src/index.ts

# Find enum schema
rg "z\.enum" src/index.ts
```

## Common Gotchas

- **Single entry point**: All exports from `index.ts` only
- **Build required**: Changes require `bun run build` to propagate
- **Cuid2 IDs**: Always use `z.string().cuid2()` for ID fields
- **Phone format**: E.164 requires `+` prefix (e.g., `+1234567890`)

## Pre-PR Checks

```bash
cd packages/types && bun run typecheck && bun run lint && bun run build
```

## Consumer Usage

```ts
// In web or api
import { PipelineStageSchema, type MinimalFirstTimer } from '@firsttimers/types';
```
