# apps/worker - BullMQ Background Jobs

BullMQ worker for async processing: email notifications, SMS, and background tasks.

## Setup & Run

```bash
# From repo root
bun install

# Dev server (runs via turbo)
bun run dev

# Or directly
cd apps/worker && bun run dev

# Build
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
├── index.ts           # Worker bootstrap, job processors
└── queues/            # Queue definitions (if needed)
```

### Job Processing Pattern

- **DO**: Use Zod to validate job payloads
  ```ts
  const payloadSchema = z.object({ ... });
  const parsed = payloadSchema.safeParse(job.data);
  if (!parsed.success) throw new Error('Invalid payload');
  ```

- **DO**: Handle each job type in switch statement
  ```ts
  switch (job.name) {
    case 'send-notification':
      await processNotification(job.data);
      break;
    default:
      logger.warn({ jobName: job.name }, 'Unknown job type');
  }
  ```

- **DO**: Log job start/completion/failure
  ```ts
  logger.info({ jobId: job.id, name: job.name }, 'Processing job');
  // ... process ...
  logger.info({ jobId: job?.id }, 'Job completed');
  ```

### Provider Pattern

- Email: Resend API (configured via `RESEND_API_KEY`, `FROM_EMAIL`)
- SMS: Twilio (configured via `TWILIO_*` vars)
- Providers are optional - worker starts without them but logs warnings

### Error Handling

- Throw errors to mark job as failed (BullMQ will retry)
- Log errors with context before throwing
- Use `try/catch` around external API calls

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Worker setup, all job processors |

## JIT Index

```bash
# Find job processor
rg "case '" src/index.ts

# Find provider class
rg "class.*Provider" src/index.ts

# Find Zod schema
rg "z\.(object|enum)" src/index.ts
```

## Common Gotchas

- **Queue name**: Set via `QUEUE_NAME` env var (default: `firsttimers-default`)
- **Redis URL**: Must match API's BullMQ configuration
- **Providers optional**: Worker starts without email/SMS config but warns
- **Graceful shutdown**: SIGINT/SIGTERM handlers close worker properly

## Pre-PR Checks

```bash
cd apps/worker && bun run typecheck && bun run lint
```

## Environment Variables

See `.env.example` in repo root:
- `REDIS_URL` - BullMQ connection
- `QUEUE_NAME` - Queue to process
- `RESEND_API_KEY` + `FROM_EMAIL` - Email provider
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER` - SMS provider
