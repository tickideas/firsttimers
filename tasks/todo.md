# Dependency Maintenance Plan

## Scope

Update low-risk dependency versions within current major lines and refresh the Bun lockfile. Defer major migrations to separate work.

## Tasks

- [ ] Apply current-major package updates across root, apps, and packages.
- [ ] Run `bun install` to refresh `bun.lock`.
- [ ] Run `bun run check` to verify typecheck and lint.
- [ ] Re-run `bun outdated --recursive` to document remaining major upgrades.

## Deferred major migrations

- Zod 4
- TypeScript 6
- ESLint 10
- Pino 10
- lucide-react 1.x
- bcryptjs 3
- Node type major updates
