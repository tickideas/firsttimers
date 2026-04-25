# Dependency Maintenance Plan

## Scope

Update dependency versions across the monorepo while keeping the project buildable before launch.

## Tasks

- [x] Apply current-major package updates across root, apps, and packages.
- [x] Run `bun install` to refresh `bun.lock`.
- [x] Run `bun run check` to verify typecheck and lint.
- [x] Re-run `bun outdated --recursive` to document remaining major upgrades.
- [x] Apply viable major-version upgrades before launch.
- [x] Fix migration fallout from Zod 4 and TypeScript 6.
- [x] Re-run `bun run check` after major upgrades.

## Applied major migrations

- Zod 4
- TypeScript 6
- Pino 10
- lucide-react 1.x
- bcryptjs 3
- globals 17
- Node type major updates
- eslint-plugin-react-hooks 7

## Deferred major migrations

- ESLint 10 remains deferred because the current Next/React lint stack crashes under ESLint 10. ESLint is pinned to latest 9.x (`9.39.4`) until the Next/React lint ecosystem is compatible.

## Review

- Updated low-risk current-major dependencies and refreshed `bun.lock`.
- Added missing API runtime dependencies `@sentry/bun` and `@opentelemetry/api`; they were dynamically imported by `apps/api/src/lib/telemetry.ts` but not declared, which broke typecheck once caches were refreshed.
- Applied viable major dependency upgrades before launch.
- Updated Zod 4 compatibility: replaced `ZodError.errors` with `ZodError.issues`, changed `z.record(valueSchema)` calls to explicit key/value schemas, and adjusted pagination transforms that conflicted with Zod 4 defaults.
- Added TypeScript 6 deprecation acknowledgement for `baseUrl` via `ignoreDeprecations`.
- `bun run check` passes with existing lint warnings only.
- `bun outdated --recursive` now only reports ESLint 10 as outstanding.
