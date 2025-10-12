# Docker Development Setup for First Timers

## Overview

This project uses Docker to provide a complete local development environment with all necessary services:

- **PostgreSQL 17** with required extensions (citext, pg_trgm, pgcrypto)
- **Redis 7** for caching and BullMQ queues  
- **API Service** (Hono on Bun)
- **Web Service** (Next.js on Bun)
- **Worker Service** (BullMQ on Bun)
- **pgAdmin** for database management

## Quick Start

### 1. Start Development Environment

```bash
# Make the script executable (first time only)
chmod +x docker-scripts.sh

# Start all services
./docker-scripts.sh up
```

Services will be available at:
- **Web App**: http://localhost:3000
- **API**: http://localhost:3001/health
- **pgAdmin**: http://localhost:5050

### 2. Development Workflow

```bash
# Build all services
./docker-scripts.sh build

# View logs
./docker-scripts.sh logs

# Run database migrations
./docker-scripts.sh migrate

# Seed database
./docker-scripts.sh seed

# Reset environment (full cleanup)
./docker-scripts.sh reset

# Stop all services
./docker-scripts.sh down
```

## File Structure

```
├── docker-compose.yaml         # Main Docker configuration
├── docker-scripts.sh         # Control script
├── .env.docker            # Docker environment variables
├── prisma/init.sql          # Database initialization
├── apps/api/Dockerfile       # API service
├── apps/web/Dockerfile       # Web service  
└── apps/worker/Dockerfile     # Worker service
```

## Docker Compose Profiles

- `dev` (default): Development environment with hot reloading
- `prod`: Production-like environment

```bash
# Start production mode
docker-compose --profile prod up -d
```

## Environment Variables

Copy `.env.docker` to `.env` for Docker development:

```bash
cp .env.docker .env
```

## Database Access

**pgAdmin Credentials:**
- Email: admin@firsttimers.org
- Password: pgadmin_password

**Database Connection:**
- Host: localhost:5432
- Database: firsttimers
- User: firsttimers_user
- Password: firsttimers_password

## Health Checks

Services include health checks:
- API: GET /health
- Web: GET /api/health
- PostgreSQL: pg_isready
- Redis: redis-cli ping

## Notes

- Hot reloading enabled for development
- PostgreSQL and Redis data persists in named volumes
- Extensions (citext, pg_trgm, pgcrypto) auto-installed
- Perfect for testing the complete application locally
