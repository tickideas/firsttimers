# Dokploy Deployment Guide

This guide covers deploying the First Timers platform to a self-hosted Dokploy instance.

## Prerequisites

- Dokploy instance running with Traefik
- Domain with DNS configured (e.g., `app.example.com`, `api.example.com`)
- Git repository connected to Dokploy

## Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              Dokploy / Traefik              │
                    └─────────────┬───────────────┬───────────────┘
                                  │               │
                    ┌─────────────▼───┐   ┌───────▼─────────────┐
                    │  api.example.com │   │  app.example.com    │
                    │     (API:3001)   │   │     (Web:3000)      │
                    └────────┬────────┘   └───────────┬─────────┘
                             │                        │
                    ┌────────▼────────────────────────▼─────────┐
                    │              Internal Network              │
                    └────┬──────────────┬──────────────┬────────┘
                         │              │              │
                   ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
                   │  Worker   │  │ PostgreSQL │  │   Redis   │
                   │ (BullMQ)  │  │    :5432   │  │   :6379   │
                   └───────────┘  └────────────┘  └───────────┘
```

**Services:**
- **Web** (Next.js 15): Frontend application on port 3000
- **API** (Hono + Bun): REST API on port 3001
- **Worker** (BullMQ): Background job processor
- **PostgreSQL 17**: Primary database with RLS
- **Redis 7**: Queue and caching

## Quick Deploy

### 1. Create Compose Project in Dokploy

1. Go to Dokploy dashboard > Projects > Create Project
2. Add a new **Compose** service
3. Connect your Git repository
4. Set compose file path to: `dokploy-compose.yaml`

### 2. Configure Environment Variables

In Dokploy, add these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | Database password (use alphanumeric only, no special chars) |
| `JWT_SECRET` | Yes | JWT signing key (min 32 chars, generate: `openssl rand -base64 48`) |
| `ENCRYPTION_KEY` | Yes | Data encryption key (generate: `openssl rand -base64 32`) |
| `API_DOMAIN` | Yes | API subdomain (e.g., `api.example.com`) |
| `WEB_DOMAIN` | Yes | Web app subdomain (e.g., `app.example.com`) |
| `BREVO_API_KEY` | No | Brevo email API key |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (e.g., `https://*.lwukz1.church`) |

**Note:** `DATABASE_URL` is now automatically constructed from `POSTGRES_PASSWORD`.
You no longer need to set it separately.
| `POSTGRES_DB` | No | Database name (default: `firsttimers`) |
| `POSTGRES_USER` | No | Database user (default: `firsttimers_user`) |

**Important:** If your Dokploy instance has multiple compose projects, the hostname
`postgres` can collide across networks. This guide uses the internal alias
`ft-postgres` to ensure the API and worker always reach the correct database
container.

### 3. Configure Domains in Dokploy

1. Go to your compose service > Domains
2. Add domain for API: `api.example.com`
3. Add domain for Web: `app.example.com`
4. Enable HTTPS (Let's Encrypt)

### 4. Deploy

Click **Deploy** in Dokploy. The services will:
1. Build the Docker images
2. Start PostgreSQL and Redis
3. Wait for database health checks
4. Start API, Worker, and Web services

### 5. Run Initial Migration

After first deploy, run the migration:

```bash
# In Dokploy terminal or via SSH
docker compose -f dokploy-compose.yaml --profile migrate up migrate
```

Or trigger from Dokploy:
1. Go to compose service > Commands
2. Run: `docker compose --profile migrate up migrate`

### 6. Seed Database (Optional)

To add initial data:

```bash
docker compose exec api bun run prisma:seed
```

## Important: Lockfile Management

This project uses Bun as the package manager. The `bun.lock` file **must be committed to git** for reproducible Docker builds.

### Bun Version Pinning

The Dockerfiles are pinned to a specific Bun version (currently `1.3.8`) to ensure the lockfile matches. If you upgrade Bun locally:

```bash
# Upgrade bun
bun upgrade

# Regenerate lockfile
rm bun.lock && bun install

# Update Dockerfiles to match your bun version
# Change: FROM oven/bun:1.3.8 to your version

# Commit everything
git add bun.lock apps/*/Dockerfile
git commit -m "chore: upgrade bun to X.X.X"
git push
```

### Monorepo Lockfile Requirements

Bun's lockfile includes checksums for ALL `package.json` files in the workspace. The Dockerfiles must copy all of them before running `bun install --frozen-lockfile`:

```dockerfile
# All package.json files must be copied
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
RUN bun install --frozen-lockfile
```

## Troubleshooting

### Build fails with "lockfile had changes"

This means the lockfile doesn't match the package.json files. Fix:

```bash
# Locally, regenerate the lockfile
rm bun.lock && bun install
git add bun.lock && git commit -m "fix: regenerate lockfile" && git push
```

### Build fails with file not found

Ensure all referenced files exist and are not in `.gitignore`. Common issues:
- `bun.lock` was in `.gitignore` (remove it)
- `bun.lockb` referenced but doesn't exist (use `bun.lock`)

### Check service logs

```bash
docker compose -f dokploy-compose.yaml logs api
docker compose -f dokploy-compose.yaml logs web
docker compose -f dokploy-compose.yaml logs worker
docker compose -f dokploy-compose.yaml logs postgres
```

### Database connection issues

```bash
docker compose -f dokploy-compose.yaml exec postgres psql -U firsttimers_user -d firsttimers

If the API is failing auth but `psql` works, verify the API is resolving the right database host:

```bash
docker compose -f dokploy-compose.yaml exec api getent hosts ft-postgres
docker compose -f dokploy-compose.yaml exec api printenv DATABASE_URL
```
```

### Restart a service

```bash
docker compose -f dokploy-compose.yaml restart api
```

### Full rebuild (clear cache)

```bash
docker compose -f dokploy-compose.yaml build --no-cache
docker compose -f dokploy-compose.yaml up -d
```

## Backup & Restore

### Database backup

```bash
docker compose -f dokploy-compose.yaml exec postgres pg_dump -U firsttimers_user firsttimers > backup.sql
```

### Restore database

```bash
cat backup.sql | docker compose -f dokploy-compose.yaml exec -T postgres psql -U firsttimers_user firsttimers
```

## Updating the Application

1. Push changes to your Git repository
2. In Dokploy, click **Redeploy**
3. Run migrations if schema changed:
   ```bash
   docker compose --profile migrate up migrate
   ```

## Production Checklist

Before going live:

- [ ] Strong passwords generated for `POSTGRES_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY`
- [ ] Domains configured with HTTPS
- [ ] Database backups scheduled
- [ ] Health endpoints accessible (`/health`, `/api/health`)
- [ ] Brevo API key configured for email functionality
- [ ] Initial database migration run
- [ ] Test user accounts created via seed or manually
