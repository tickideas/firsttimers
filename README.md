# CE FirstTouch

A modern church management platform for Christ Embassy FirstTimers Ministry - tracking first-time visitors, follow-ups, foundation school, and department onboarding across multiple churches.

## 🎯 Purpose

CE FirstTouch helps churches systematically welcome, track, and integrate first-time visitors into their community through automated follow-up workflows, foundation school management, and department placement.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) v1.3+
- [Docker](https://docker.com/) & Docker Compose
- PostgreSQL 17+ (or use Docker setup)
- Redis (for background jobs)

### Local Development

```bash
# Clone and install
git clone <repository-url>
cd ce-firsttouch
bun install

# Start full stack with Docker
./docker-scripts.sh up

# Or start services individually
bun run dev        # Frontend + API
bun run worker:dev # Background jobs
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Generate database
cd prisma && bunx prisma generate

# Run migrations
bun run prisma:migrate
```

## 📁 Project Structure

```
├─ apps/
│  ├─ web/     → Next.js 15 + React 19 frontend
│  ├─ api/     → Hono + Bun REST API
│  └─ worker/  → BullMQ background jobs
├─ packages/
│  ├─ types/   → Shared Zod schemas
│  ├─ ui/      → Shared UI components
│  └─ config/  → Configuration utilities
└─ prisma/     → Database schema + migrations
```

## 🛠️ Tech Stack

- **Runtime**: Bun v1.3
- **Frontend**: Next.js App Router + React Server Components
- **Backend**: Hono + TypeScript
- **Database**: PostgreSQL 17 with Row-Level Security
- **ORM**: Prisma
- **Queue**: BullMQ + Redis
- **Authentication**: JWT with RBAC
- **Validation**: Zod schemas

## 🔧 Development Commands

```bash
# Development
bun run dev          # Start all services
bun run dev:web      # Frontend only
bun run dev:api      # API only
bun run worker:dev   # Background worker

# Code Quality
bun run check        # Type check + lint
bun run lint         # Auto-fix style issues
bun run test         # Run all tests

# Database
bun run prisma:migrate    # Run migrations
bun run prisma:studio     # Open Prisma Studio
bun run prisma:generate   # Generate client

# Docker
./docker-scripts.sh up     # Start full stack
./docker-scripts.sh down   # Stop services
./docker-scripts.sh test   # Run tests in containers
```

## 🔐 Security & Compliance

- **Multi-tenancy**: Tenant isolation via `tenant_id` on all tables
- **Data Protection**: GDPR compliant with right to erasure
- **Phone Numbers**: E.164 normalization for consistency
- **Email**: Case-insensitive matching with citext
- **Audit Logging**: All PII access tracked
- **Row-Level Security**: PostgreSQL RLS for data isolation

## 🧪 Testing

```bash
# Unit tests
bun run test

# Integration tests
bun run test:integration

# E2E tests
bun run test:e2e

# Load testing
bun run test:load
```

## 📊 Features

### Current (Phase 1 - MVP)
- ✅ Public visitor forms with church-specific URLs
- ✅ SMS/WhatsApp verification system
- ✅ Automated follow-up workflows
- ✅ Basic visitor tracking dashboard

### Upcoming (Phase 2)
- 🔄 Foundation school management
- 🔄 Department onboarding workflows
- 🔄 Advanced reporting and analytics

### Future (Phase 3-4)
- 📋 Custom form builder v2
- 📅 Scheduled reports
- 🔒 Advanced privacy tools
- ⚡ Performance optimizations

## 🔗 API Endpoints

### Public Forms
```
GET  /f/{churchSlug}/{formId}     → Visitor form
POST /f/{churchSlug}/{formId}     → Submit form
```

### Health Checks
```
GET /health      → Frontend health
GET /api/health  → API health
```

## 🚢 Deployment

### Docker Production
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Key variables needed in production:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Authentication secret
- `SMS_API_KEY` - SMS/WhatsApp service
- `EMAIL_API_KEY` - Email service

See `.env.example` for complete list.

## 🤝 Contributing

1. Branch from `main` with descriptive names
2. Run `bun run check` before committing
3. Add tests for new features
4. Ensure Docker setup works
5. Follow existing code patterns

## 📞 Support

For technical support or questions:
- Create an issue in this repository
- Contact the development team
- Check the [Technical Specification](Technical_Specification.md)

## 📄 License

Private software - Christ Embassy FirstTimers Ministry. All rights reserved.

---

**Built with ❤️ for Christ Embassy FirstTimers Ministry**
