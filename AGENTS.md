# First Timers Management Platform

Turborepo monorepo for church first-timer management. Bun runtime, Next.js frontend, Hono API, BullMQ workers.

## Quick Start

```bash
# Install dependencies
bun install

# Start dev servers (all apps)
bun run dev

# Or use Docker for full stack
./docker-scripts.sh up

# Before committing
bun run check
```

## Project Structure

| Package | Path | Description |
|---------|------|-------------|
| Web | `apps/web/` | Next.js 15 + React 19 frontend → [see AGENTS.md](apps/web/AGENTS.md) |
| API | `apps/api/` | Hono REST API with JWT auth → [see AGENTS.md](apps/api/AGENTS.md) |
| Worker | `apps/worker/` | BullMQ background jobs → [see AGENTS.md](apps/worker/AGENTS.md) |
| Types | `packages/types/` | Shared Zod schemas → [see AGENTS.md](packages/types/AGENTS.md) |
| UI | `packages/ui/` | Shared React components → [see AGENTS.md](packages/ui/AGENTS.md) |
| Config | `packages/config/` | Shared ESLint/TS configs |

## Universal Conventions

- **Runtime**: Bun v1.3+ exclusively
- **Style**: TypeScript strict, single quotes, trailing commas, no semicolons, 100-char limit
- **Commits**: Conventional format (`feat:`, `fix:`, `test:`, `docs:`)
- **Branches**: `feature/description` or `bugfix/description` from `main`
- **PRs**: Require `bun run check` passing, proof artifact, no new deps without review

## Security & Secrets

- NEVER commit `.env` files or API keys
- Secrets go in `.env` (gitignored) - see `.env.example` for template
- PII access requires audit logging
- All tenant data isolated via `tenant_id` + RLS

## Database

```bash
# Schema: prisma/schema.prisma
bun run prisma:migrate   # Create migration
bun run prisma:push      # Quick schema push (dev only)
bun run prisma:studio    # Visual editor
```

## Quick Find Commands

```bash
# Find component
rg "export (function|const)" apps/web/app --type tsx

# Find API route
rg "register.*Routes" apps/api/src/routes --type ts

# Find Zod schema
rg "z\.(object|enum|string)" packages/types --type ts

# Find test
find . -name "*.test.ts" -o -name "*.spec.ts"
```

## Definition of Done

- [ ] `bun run check` passes (typecheck + lint)
- [ ] Tests pass (`bun run test`)
- [ ] No secrets in diff
- [ ] Proof artifact attached (test output, screenshot, etc.)

## Workflow Orchestration

### Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops

### Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer

### Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Header Comments (MANDATORY)

EVERY file MUST start with 4 lines of comments:
1. Exact file location in codebase
2. Clear description of what this file does
3. Clear description of WHY this file exists
4. RELEVANT FILES: comma-separated list of 2–4 most relevant files

## Git Workflow Requirements (MANDATORY)

Before writing ANY code, you MUST:
1. **Create a feature branch: `git checkout -b feature/[name]`**
2. **Commit changes FREQUENTLY (every file/component)**
3. **Never work on the main branch directly**

**ALWAYS commit after each new function is added to the codebase**

## Code Quality Checks (MANDATORY)

**ALWAYS run the following before completing any task:**
1. Use IDE diagnostics tool to check for linting and type errors
2. Fix any linting or type errors before considering the task complete
3. Do this for any file you create or modify

## Development Standards

- Always write secure, best practice code
- Always write tests for each function created
- Iterate the function based on test results
- Delete test scripts once tests pass
- Always commit after each new function

## Deployment Notes

- Health endpoints: `/health` (API), `/api/health` (web proxy)
- CORS origins must be set via `CORS_ORIGINS` in production
- Database URL should use `ft-postgres` hostname in Dokploy (not `postgres`)
- See `docs/DOKPLOY.md` and `docs/DOCKER.md` for deployment details
