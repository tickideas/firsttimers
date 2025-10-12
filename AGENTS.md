# First Timers Management Platform

This is the First Timers Management Platform. A modern church management system for tracking first-time visitors, follow-ups, foundation school, and department onboarding across multiple tenant organizations.

## Core Commands

• Type-check and lint: `bun run check`
• Auto-fix style: `bun run lint`
• Run tests: `bun run test`
• Start dev servers: `bun run dev` (or `./docker-scripts.sh up` for Docker with full stack)
• Build for production: `bun run build`
• Database migrations: `bun run prisma:migrate`
• Docker local stack: `./docker-scripts.sh up`
• Docker tests: run tests inside containers

## Project Layout

```
├─ apps/
│  ├─ web/ → Next.js 15 + React 19 + TypeScript frontend
│  ├─ api/ → Hono + Bun REST API
│  └─ worker/ → BullMQ background jobs
├─ packages/
│  ├─ types/ → Shared Zod schemas
│  ├─ ui/ → Shared UI components
│  └─ config/ → Configuration utilities
└─ prisma/ → Database schema + migrations
```

• Frontend code lives **only** in `apps/web/`
• Backend code lives **only** in `apps/api/`
• Worker code lives **only** in `apps/worker/`
• Shared types in `packages/types/`
• Shared UI in `packages/ui/`

## Development Patterns & Constraints

### Tech Stack
• **Runtime**: Bun v1.3 exclusively
• **Frontend**: Next.js App Router + React Server Components
• **Backend**: Hono + TypeScript
• **Database**: Prisma ORM + PostgreSQL 17 with RLS
• **Queue**: BullMQ + Redis

### Coding Style
• TypeScript strict mode, single quotes, trailing commas, no semicolons
• 100-char line limit, 2-space indent (4-space for YAML/JSON/MD)
• Use interfaces for public APIs; avoid `@ts-ignore`
• Zod validation for all input/output
• Postgres Row-Level Security for multi-tenancy
• JWT authentication with RBAC

### Data & Security
• Tenant isolation via `tenant_id` on all core tables
• Phone numbers: E.164 normalization required
• Email: citext for case-insensitive matching
• GDPR compliance: right to erasure/anonymization
• Audit logging for all PII access

### Testing Strategy
• Unit tests for Zod schemas and services
• Integration tests against real Postgres/Redis
• E2E with Playwright for user workflows
• Load testing for 100 concurrent churches

## Git Workflow Essentials

1. Branch from `main` with descriptive names: `feature/church-onboarding` or `bugfix/phone-validation`
2. Run `bun run check` locally **before** committing
3. Force pushes **allowed only** on your branch using `git push --force-with-lease`
4. Keep commits atomic; prefer checkpoints (`feat: add verification queue`, `test: phone normalization`)
5. Docker validation: ensure `./docker-scripts.sh up` works

## Evidence Required for Every PR

A pull request is reviewable when it includes:

- All tests green (`bun run test`)
- Lint & type check pass (`bun run check`)
- Diff confined to agreed paths (see Project Layout)
- **Proof artifact**
  - Bug fix → failing test added first, now passes
  - Feature → new tests or workflow demonstration
  - GDPR change → privacy impact assessment
- One-paragraph description covering tenant impact & audit implications
- **No new runtime dependencies** without architecture review

## Phase Alignment

Ensure changes align with current phase:

**Phase 1 – MVP** (Current): Public forms, verification, basic follow-up
**Phase 2**: Foundation school, department onboarding
**Phase 3**: Form builder v2, scheduled reports
**Phase 4**: Privacy tooling, performance optimization

## Special Constraints

• No breaking changes to `/f/{churchSlug}/{formId}` endpoints
• Tenant data must never cross tenant boundaries
• All form submissions require consent tracking
• Report exports must include audit trail
• Phone/email validation follows Phase 1 spec

## Deployment Readiness

• Health endpoints functional (`/health`, `/api/health`)
• Environment variables documented
• Docker build passes
• Coolify deployment tested
