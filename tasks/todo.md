# Dependency Maintenance Plan

## Scope

Update low-risk dependency versions within current major lines and refresh the Bun lockfile. Defer major migrations to separate work.

## Tasks

- [x] Apply current-major package updates across root, apps, and packages.
- [x] Run `bun install` to refresh `bun.lock`.
- [x] Run `bun run check` to verify typecheck and lint.
- [x] Re-run `bun outdated --recursive` to document remaining major upgrades.

## Deferred major migrations

- Zod 4
- TypeScript 6
- ESLint 10
- Pino 10
- lucide-react 1.x
- bcryptjs 3
- Node type major updates

## Review

- Updated low-risk current-major dependencies and refreshed `bun.lock`.
- Added missing API runtime dependencies `@sentry/bun` and `@opentelemetry/api`; they were dynamically imported by `apps/api/src/lib/telemetry.ts` but not declared, which broke typecheck once caches were refreshed.
- `bun run check` passes with existing lint warnings only.
- Remaining outdated packages are major-version migrations and should be handled separately.
