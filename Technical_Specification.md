# First Timers Management Platform — Technical Specification (v1.2)

Aligned stack and constraints:
- Runtime/PM: Bun v1.3
- Frontend: Next.js 15.5.4 (App Router), React 19.2, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Hono (or Fastify) on Bun for REST API, TypeScript
- Database: PostgreSQL 17 (RLS, pg_trgm, citext, pgcrypto)
- Queue/Cache: Redis (BullMQ)
- Email: Brevo (SMTP/API v3)
- Deploy: Coolify with separate apps/services (web, api, worker, plus managed Redis and Postgres)
- Locale: English (for now)
- Scale: 50–100 churches
- Compliance: GDPR

---

## 1) Vision & Goals
Digitize and standardize first‑timer intake, verification, follow‑up, Foundation School enrollment, and department onboarding across both hierarchical (Zone → Group → Church) and standalone churches. Provide QR‑linked forms, configurable fields (beside mandatory), robust pipeline tracking, role‑based dashboards, and GDPR‑compliant data governance.

## 2) Roles & Access Model
- Roles: super_admin, zonal_admin, group_admin, church_admin, verifier, followup_agent, foundation_coordinator, department_head.
- Tenancy: Each Zone is a Tenant; standalone churches are their own Tenant. Within a tenant: Groups → Churches.
- Access control: RBAC enforced in API; Postgres Row‑Level Security (RLS) by tenant_id and optional scope (group_id, church_id).

## 3) Forms & QR
- Mandatory fields (initial): full_name, at least one of phone/email, consent (GDPR). Church inferred by link/QR; service_event selected or inferred.
- Custom fields (per church): v1 limited set (text/select/checkbox/date); v2 full builder with conditional logic and versioning.
- Public endpoints and shareable QR (PNG/SVG) to `/f/{churchSlug}/{formId}`. Kiosk/PWA mode for offline capture and later sync.
- Dedupe: normalize phone to E.164, citext email, fuzzy match on name + time window using pg_trgm.

## 4) Core Workflows
1) Intake & Verification: Submissions enter a verification queue for First Timers Dept to validate/correct and resolve duplicates.
2) Follow‑up: Assign to staff; log contact attempts (call/SMS/WhatsApp/note), outcomes, next action dates, SLA reminders.
3) Pipeline & Statuses: New → Verified → Contacted → In Progress → Foundation Enrolled → In Class → Foundation Completed → Dept Onboarding → Active Member → Dormant (configurable per tenant; all transitions audited).
4) Foundation School: Courses/classes per church, schedules/sessions, enrollment, attendance, completion.
5) Departments: Catalog per church; interest → onboarding → accepted → active; linked to pipeline.
6) Reporting: Zone/Group/Church dashboards for funnel metrics and foundation attendance; CSV export; scheduled email reports via Brevo.

## 5) Architecture Overview
- Monorepo (Turborepo) with separate deployables:
  - apps/web: Next.js admin portal + public forms + kiosk PWA.
  - apps/api: Hono REST API (Bun) with OpenAPI and Zod validation.
  - apps/worker: Bun worker (BullMQ) for emails, reminders, exports.
- Shared packages: `packages/ui`, `packages/types` (zod schemas), `packages/config`.
- Postgres 17 with RLS; Redis for queues/rate limits; S3‑compatible storage optional for exports.
- Observability: Pino logs, OpenTelemetry traces, Sentry errors; health endpoints for Coolify.

## 6) Tech Choices & Rationale
- Next.js 15 App Router + React 19 for modern, performant web with server components and PWA.
- Hono on Bun for lightweight, fast REST API compatible with Bun runtime.
- Prisma ORM for productivity; RLS enforced at DB; RBAC in service layer.
- BullMQ + Redis for background jobs; fallback to pg‑boss if Bun/Redis libs pose issues.
- Brevo for transactional/scheduled emails; tenant branding via templates.

## 7) High‑Level Data Model
- Tenant(id, name, mode: zone|standalone)
- Zone(id, tenant_id, name)
- Group(id, tenant_id, zone_id?, name)
- Church(id, tenant_id, group_id?, name, slug, settings_json)
- User(id, tenant_id, email[citext], phone, name, active, 2fa?)
- Role(id, key); UserRole(user_id, role_id, tenant_id, scope: zone|group|church, scope_id?)
- ServiceEvent(id, church_id, starts_at, type)
- Form(id, church_id, version, schema_json, active)
- FormSubmission(id, form_id, first_timer_id?, payload_json, meta)
- FirstTimer(id, tenant_id, church_id, service_event_id?, full_name, email[citext]?, phone_e164?, consent, source, status, tags[])
- FollowUp(id, first_timer_id, assigned_to, current_stage, priority)
- ContactAttempt(id, follow_up_id, channel, outcome, notes, next_action_at)
- FoundationCourse(id, tenant_id, name)
- FoundationClass(id, church_id, course_id, schedule)
- FoundationEnrollment(id, first_timer_id, class_id, status, attendance[])
- Department(id, church_id, name)
- DepartmentEnrollment(id, first_timer_id, department_id, status)
- Notification(id, type, target, payload, status)
- AuditLog(id, actor_id, action, entity, before, after, at)

Indexes/constraints: tenant_id on all core tables; unique dedupe constraints on normalized phone/email + date window; trigram indexes for name similarity; scope indexes for group_id/church_id.

## 8) API Design (REST v1; apps/api)
- Auth: POST /auth/login, POST /auth/logout, POST /auth/refresh
- Org: GET /tenants/:id, GET /groups, GET/POST/PATCH /churches
- Forms: GET/POST /churches/:id/forms, GET /forms/:id, POST /forms/:id/submit (idempotency key), GET /churches/:id/qr
- First Timers: GET/POST/PATCH /first-timers, POST /first-timers/:id/verify, POST /first-timers/:id/transition
- Follow-up: GET/POST /first-timers/:id/follow-ups, POST /follow-ups/:id/contact-attempts
- Foundation: /foundation/courses|classes|enrollments|attendance
- Departments: /departments|enrollments
- Reports: GET /reports/overview?level=zone|group|church&range=..., GET /exports/first-timers.csv
- Conventions: JWT bearer auth; RBAC enforced; cursor pagination; ETag caching for reports.

## 9) Security & GDPR
- Consent capture on public forms; purpose limitation; minimal data collection.
- DSAR tooling: export (CSV/JSON), rectification, erasure (soft‑delete + anonymization), restriction, objection.
- RLS policies and least‑privilege DB roles; TLS for all traffic; secrets via Coolify.
- Audit logging for all PII reads/mutations; configurable retention; pseudonymized analytics.
- Rate limiting and bot protection on public endpoints; CSRF for admin; optional 2FA for admins.

## 10) Deploy on Coolify (separate apps/services)
Services:
1) Postgres 17 — DATABASE_URL
2) Redis — REDIS_URL
3) API app (apps/api) — PORT=3001, health `/health`
4) Worker app (apps/worker) — no HTTP; same env as API
5) Web app (apps/web) — PORT=3000, health `/api/health`

Essential environment variables:
```
DATABASE_URL=postgres://...
REDIS_URL=redis://...
BREVO_API_KEY=...
JWT_SECRET=...
NEXT_PUBLIC_API_URL=https://api.example.org
NODE_ENV=production
RLS_SUPER_ROLE=... (migrations only)
ENCRYPTION_KEY=... (PII at rest where needed)
NEXTAUTH_SECRET=... (if using Auth.js/session on web)
```

Note: Build and deploy each app with its own Dockerfile in Coolify; no docker‑compose bundling.

## 11) Testing Strategy
- Unit: Zod schemas, services, utilities (Vitest on Bun).
- Integration: API routes against ephemeral Postgres/Redis (Testcontainers or containers in CI).
- E2E: Playwright — public form → verification → pipeline → enrollment → reports.
- Load: simulate concurrent submissions across 100 churches.

## 12) Phased Implementation Plan
Phase 0 – Foundations (1–2 weeks)
- Monorepo setup (Turborepo) and Bun toolchain
- Apps bootstrap: web (Next), api (Hono), worker (BullMQ)
- Prisma schema skeleton with RLS policies and migrations
- Auth baseline (JWT for API, optional NextAuth for web), RBAC scaffolding
- Observability (Pino, Sentry, OTEL) and health endpoints
- Coolify pipelines (web/api/worker) and managed Postgres/Redis
- CI (lint, typecheck, test, build) per app

Phase 1 – MVP (3–5 weeks)
- Public intake form (v1 curated + limited custom fields), QR generator
- Phone/email validation + E.164 normalization; dedupe suggestions (pg_trgm)
- Verification queue + assignment; follow‑up logging; pipeline transitions
- Zonal/group/church scoping across UI and API
- Dashboards: funnel metrics; CSV export; Brevo transactional emails
- Rate limiting and bot protection for public forms; PWA base for kiosk

Phase 2 – Foundation & Departments (3–4 weeks)
- Foundation courses/classes; enrollment and attendance; completion tracking
- Department catalog; onboarding flow (interest → accepted → active)
- Attendance and engagement reporting

Phase 3 – Form Builder v2 & Scheduled Reports (3–5 weeks)
- Drag‑and‑drop builder, conditional logic, versioning per church
- Scheduled Brevo email reports; improved exports

Phase 4 – Hardening & Privacy (ongoing)
- DSAR workflows, retention/anonymization tooling
- Admin audit viewer; optional 2FA; backup/restore runbooks
- Performance and cost optimizations; error budgets and SLOs

---

## 13) Checklists (GitHub‑style)

### A) Coolify & Infrastructure
- [ ] Create Postgres 17 service and capture DATABASE_URL
- [ ] Create Redis service and capture REDIS_URL
- [ ] Create API app (apps/api) with Dockerfile; set env vars; health `/health`
- [ ] Create Worker app (apps/worker); set env vars; ensure queue connectivity
- [ ] Create Web app (apps/web) with Dockerfile; set env vars; health `/api/health`
- [ ] Configure domains/TLS for web and api
- [ ] Configure Brevo sender domains (SPF/DKIM) per tenant/primary domain
- [ ] Set secrets in Coolify for all environments (dev/staging/prod)

### B) Phase 0 – Foundations
- [x] Initialize monorepo (Turborepo) and Bun v1.3
- [x] apps/web scaffold (Next.js 15.5.4, React 19.2)
- [x] apps/api scaffold (Hono on Bun)
- [x] apps/worker scaffold (BullMQ on Bun)
- [x] packages/types (zod), packages/ui, packages/config
- [x] Prisma setup, DB connection, initial schema with Tenant/Group/Church/User/Role
- [x] Implement RLS policies and migration role
- [x] JWT auth for API; RBAC middleware skeleton
- [x] Observability (Pino logs, Sentry, OTEL traces)
- [x] Health endpoints for web/api
- [x] CI workflows (lint/typecheck/test/build)

### C) Phase 1 – MVP
- [ ] Public form v1 (curated + limited custom fields)
- [ ] QR code generator and stable links `/f/{churchSlug}/{formId}`
- [ ] Validation (email/phone), E.164 normalization
- [ ] Dedupe suggestions (phone/email/name + time window)
- [ ] Verification queue UI + API; resolve/merge duplicates
- [ ] Follow‑up logging with outcomes and next actions
- [ ] Pipeline transitions and audit logs
- [ ] Scoped dashboards (zone/group/church) with funnel metrics
- [ ] CSV export; Brevo transactional emails
- [ ] Rate limiting/bot protection; PWA base for kiosk

### D) Phase 2 – Foundation & Departments
- [ ] Foundation courses/classes models and UI
- [ ] Enrollment and attendance flows
- [ ] Department catalog and onboarding flow
- [ ] Attendance and engagement reports

### E) Phase 3 – Form Builder v2 & Reports
- [ ] Drag‑and‑drop form builder with conditional logic
- [ ] Form versioning per church; migration of active form
- [ ] Scheduled Brevo email reports

### F) Phase 4 – Hardening/Privacy
- [ ] DSAR (export/rectify/erase/restrict/object) tooling
- [ ] Retention/anonymization policies and jobs
- [ ] Admin audit viewer
- [ ] 2FA for admins (optional)
- [ ] Backups/restore runbooks; performance tuning

### G) Acceptance Criteria – MVP
- [ ] A first‑timer can submit a form via QR/public link and is visible to the correct church
- [ ] Verifier can validate, correct fields, and resolve duplicates
- [ ] Follow‑up agent can log contact attempts and advance pipeline
- [ ] Zonal/group/church admins see accurate funnel metrics
- [ ] CSV export works; transactional emails via Brevo are delivered

---

## 14) Example Dockerfiles (reference)

apps/web (Next.js on Bun):
```dockerfile
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY apps/web/package.json bun.lockb ./
RUN bun install --ci

FROM oven/bun:1.3 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM oven/bun:1.3 AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY apps/web/package.json ./package.json
EXPOSE 3000
CMD ["bun","run","start"]
```

apps/api (Hono on Bun):
```dockerfile
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY apps/api/package.json bun.lockb ./
RUN bun install --ci

FROM oven/bun:1.3 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api ./
RUN bun run build

FROM oven/bun:1.3 AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY --from=build /app/dist ./dist
COPY apps/api/package.json ./package.json
EXPOSE 3001
CMD ["bun","run","start"]
```

apps/worker (BullMQ on Bun):
```dockerfile
FROM oven/bun:1.3
WORKDIR /app
COPY apps/worker/package.json bun.lockb ./
RUN bun install --ci
COPY apps/worker ./
ENV NODE_ENV=production
CMD ["bun","run","start"]
```

---

## 15) Open Items (current)
- Confirm Brevo sender domains/branding per tenant and initial email templates.
- Specify kiosk device expectations (Android/iPad) if any to refine offline/PWA constraints.
- Confirm whether to use Hono or Fastify for API (default: Hono).

End of spec.

