# Dokploy Deployment Guide

## Prerequisites

- Dokploy instance running with Traefik
- Domain with DNS configured (e.g., `app.example.com`, `api.example.com`)

## Quick Deploy

### 1. Create Compose Project in Dokploy

1. Go to Dokploy dashboard > Projects > Create Project
2. Add a new **Compose** service
3. Connect your Git repository or paste the compose file
4. Set compose file path to: `dokploy-compose.yaml`

### 2. Configure Environment Variables

In Dokploy, add these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | Database password (generate: `openssl rand -base64 32`) |
| `JWT_SECRET` | Yes | JWT signing key (generate: `openssl rand -base64 48`) |
| `ENCRYPTION_KEY` | Yes | Data encryption key (generate: `openssl rand -base64 32`) |
| `API_DOMAIN` | Yes | API subdomain (e.g., `api.example.com`) |
| `WEB_DOMAIN` | Yes | Web app subdomain (e.g., `app.example.com`) |
| `BREVO_API_KEY` | No | Brevo email API key |
| `POSTGRES_DB` | No | Database name (default: `firsttimers`) |
| `POSTGRES_USER` | No | Database user (default: `firsttimers_user`) |

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

## Troubleshooting

### Check service logs
```bash
docker compose -f dokploy-compose.yaml logs api
docker compose -f dokploy-compose.yaml logs web
docker compose -f dokploy-compose.yaml logs worker
```

### Database connection issues
```bash
docker compose -f dokploy-compose.yaml exec postgres psql -U firsttimers_user -d firsttimers
```

### Restart a service
```bash
docker compose -f dokploy-compose.yaml restart api
```

### Full rebuild
```bash
docker compose -f dokploy-compose.yaml build --no-cache
docker compose -f dokploy-compose.yaml up -d
```

## Backup

### Database backup
```bash
docker compose -f dokploy-compose.yaml exec postgres pg_dump -U firsttimers_user firsttimers > backup.sql
```

### Restore database
```bash
cat backup.sql | docker compose -f dokploy-compose.yaml exec -T postgres psql -U firsttimers_user firsttimers
```

## Updating

1. Push changes to your Git repository
2. In Dokploy, click **Redeploy**
3. Run migrations if schema changed:
   ```bash
   docker compose --profile migrate up migrate
   ```
