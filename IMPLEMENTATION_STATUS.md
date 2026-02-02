# First Timers Implementation Status

This document tracks what has been implemented vs what remains to be built, based on the Technical Specification.

**Last Updated:** February 2026

---

## Executive Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0 - Foundations | ✅ Complete | 100% |
| Phase 1 - MVP | 🟡 Partial | ~40% |
| Phase 2 - Foundation & Departments | 🟡 Partial | ~30% |
| Phase 3 - Form Builder v2 & Reports | ⬜ Not Started | 0% |
| Phase 4 - Hardening & Privacy | ⬜ Not Started | 0% |

---

## Phase 0 - Foundations ✅ COMPLETE

All foundation items have been implemented:

- [x] Monorepo setup (Turborepo) and Bun v1.3.8
- [x] apps/web scaffold (Next.js 15, React 19)
- [x] apps/api scaffold (Hono on Bun)
- [x] apps/worker scaffold (BullMQ on Bun)
- [x] packages/types (Zod schemas)
- [x] packages/ui (shared components)
- [x] packages/config (configuration utilities)
- [x] Prisma setup with full schema (18 models)
- [x] JWT authentication for API
- [x] RBAC middleware skeleton
- [x] Multi-tenancy via Prisma extension
- [x] Health endpoints (/health, /api/health)
- [x] CI workflows (lint, typecheck, build)
- [x] Docker setup for development and production
- [x] Dokploy deployment configuration

---

## Phase 1 - MVP 🟡 IN PROGRESS

### ✅ Completed

#### Database & Models
- [x] All 18 database models defined in Prisma schema
- [x] Tenant, Group, Church hierarchy
- [x] User, Role, UserRole with scoping
- [x] FirstTimer with pipeline stages
- [x] FollowUp and ContactAttempt models
- [x] Form and FormSubmission models
- [x] VerificationCode model
- [x] AuditLog model
- [x] ServiceEvent model

#### API Endpoints
- [x] Auth: login, logout, me, tenants list
- [x] First-timers: CRUD + stats
- [x] Follow-ups: CRUD + contact attempts + stats
- [x] Verification: send code, verify, status
- [x] Forms: CRUD + duplication + field types
- [x] Public form submission: GET/POST `/f/:churchSlug/:formId`

#### Frontend Pages
- [x] Login page with church/tenant selection
- [x] Dashboard with stats cards
- [x] First-timers list with search/filter
- [x] First-timer detail view
- [x] Admin layout with sidebar navigation
- [x] Public registration form page

#### Background Jobs
- [x] BullMQ worker setup
- [x] Email notifications via Resend
- [x] SMS notifications via Twilio
- [x] Graceful shutdown handling

### ⬜ Remaining (Phase 1)

#### Public Forms
- [ ] QR code generator endpoint and UI
- [ ] Stable QR links with PNG/SVG download
- [ ] Kiosk/PWA mode for offline capture
- [ ] Rate limiting on public form endpoints
- [ ] Bot protection (CAPTCHA or honeypot)

#### Validation & Deduplication
- [ ] E.164 phone number normalization (validation exists but normalization incomplete)
- [ ] Dedupe suggestions using pg_trgm (model exists, logic not implemented)
- [ ] Fuzzy matching on name + time window
- [ ] Merge duplicate records UI

#### Verification Queue
- [ ] Verification queue UI (list of unverified first-timers)
- [ ] Bulk verification actions
- [ ] Duplicate resolution/merge UI
- [ ] Assignment of first-timers to verifiers

#### Follow-up System
- [ ] Next action date reminders
- [ ] SLA reminders/alerts
- [ ] Follow-up assignment workflow
- [ ] WhatsApp contact logging (API ready, channel not fully integrated)

#### Pipeline & Transitions
- [ ] Pipeline transition API with audit logging
- [ ] Pipeline stage change notifications
- [ ] Configurable pipeline stages per tenant

#### Dashboards & Reporting
- [ ] Zone/Group/Church scoped dashboards
- [ ] Funnel metrics visualization
- [ ] CSV export endpoint (model ready, endpoint not implemented)
- [ ] Date range filtering for reports

#### Email (Brevo)
- [ ] Brevo integration (currently using Resend)
- [ ] Transactional email templates
- [ ] Tenant-branded emails

---

## Phase 2 - Foundation & Departments 🟡 PARTIAL

### ✅ Completed

#### Database Models
- [x] FoundationCourse model
- [x] FoundationClass model
- [x] FoundationEnrollment model
- [x] Department model
- [x] DepartmentEnrollment model

#### API Endpoints
- [x] Foundation courses: CRUD
- [x] Foundation classes: CRUD
- [x] Foundation enrollments: create, update, list
- [x] Departments: CRUD
- [x] Department enrollments: CRUD

### ⬜ Remaining (Phase 2)

#### Foundation School
- [ ] Foundation school UI pages
- [ ] Course/class scheduling interface
- [ ] Session management (dates, times, locations)
- [ ] Attendance tracking UI
- [ ] Attendance recording API
- [ ] Completion tracking and certificates
- [ ] Foundation enrollment from pipeline

#### Departments
- [ ] Department catalog UI
- [ ] Department onboarding workflow (interest → accepted → active)
- [ ] Department interest form
- [ ] Department head assignment
- [ ] Department capacity management

#### Reporting
- [ ] Foundation attendance reports
- [ ] Department engagement metrics
- [ ] Completion rate analytics

---

## Phase 3 - Form Builder v2 & Scheduled Reports ⬜ NOT STARTED

### ⬜ All Items Remaining

#### Form Builder v2
- [ ] Drag-and-drop form builder UI
- [ ] Conditional logic (show/hide fields based on answers)
- [ ] Field validation rules builder
- [ ] Form versioning per church
- [ ] Form migration tools (update active forms)
- [ ] Form preview mode
- [ ] Form analytics (submission rates, drop-offs)

#### Scheduled Reports
- [ ] Report scheduling configuration
- [ ] Brevo scheduled email reports
- [ ] Report template builder
- [ ] Recipient management per report

#### Enhanced Exports
- [ ] Improved CSV export with field selection
- [ ] Excel export option
- [ ] PDF report generation
- [ ] Export scheduling

---

## Phase 4 - Hardening & Privacy ⬜ NOT STARTED

### ⬜ All Items Remaining

#### GDPR/DSAR Tooling
- [ ] Data export (CSV/JSON for individual)
- [ ] Rectification request workflow
- [ ] Erasure/anonymization workflow (soft-delete + scrub PII)
- [ ] Restriction of processing
- [ ] Objection handling

#### Security
- [ ] Admin audit viewer UI
- [ ] 2FA for admin accounts (optional)
- [ ] Session management UI
- [ ] Failed login tracking and lockout

#### Data Management
- [ ] Retention policy configuration per tenant
- [ ] Automated anonymization jobs
- [ ] Backup/restore runbooks
- [ ] Data purge workflows

#### Performance
- [ ] Query optimization
- [ ] Caching layer (Redis)
- [ ] Connection pooling optimization
- [ ] Load testing (100 concurrent churches)

---

## Infrastructure Status

### ✅ Completed
- [x] Docker Compose for local development
- [x] Production Docker images (API, Web, Worker)
- [x] Dokploy deployment configuration
- [x] PostgreSQL 17 with extensions (citext, pg_trgm, pgcrypto)
- [x] Redis for BullMQ queues
- [x] Health check endpoints

### ⬜ Remaining
- [ ] RLS (Row-Level Security) policies in PostgreSQL
- [ ] Database role separation (app role vs migration role)
- [ ] Monitoring and alerting setup
- [ ] Log aggregation
- [ ] Error tracking (Sentry integration placeholder exists)
- [ ] OpenTelemetry tracing

---

## API Endpoints Summary

| Module | Implemented | Remaining |
|--------|-------------|-----------|
| Auth | 4/4 | 0 |
| Health | 1/1 | 0 |
| First-Timers | 5/7 | verify, transition |
| Follow-Ups | 6/6 | 0 |
| Verification | 3/3 | 0 |
| Forms | 7/7 | 0 |
| Public Forms | 2/2 | 0 |
| Foundation | 10/12 | attendance, completion |
| Departments | 8/8 | 0 |
| Reports | 0/3 | overview, exports |
| QR | 0/1 | generator |
| **Total** | **46/54** | **8** |

---

## Frontend Pages Summary

| Section | Implemented | Remaining |
|---------|-------------|-----------|
| Public | 3/3 | 0 |
| Dashboard | 1/1 | 0 |
| First-Timers | 2/3 | verification queue |
| Follow-Ups | 1/3 | assignment, SLA |
| Foundation | 0/4 | all pages |
| Departments | 0/3 | all pages |
| Reports | 0/3 | all pages |
| Settings | 0/2 | tenant, user |
| **Total** | **7/22** | **15** |

---

## Priority Recommendations

### High Priority (Complete MVP)
1. **QR Code Generator** - Critical for church adoption
2. **Verification Queue UI** - Core workflow for verifiers
3. **Pipeline Transitions** - Enable full first-timer journey
4. **CSV Export** - Immediate reporting need
5. **Brevo Email Integration** - Replace Resend with specified provider

### Medium Priority (Foundation & Departments)
1. **Foundation School UI** - Required for Phase 2
2. **Department Onboarding UI** - Required for Phase 2
3. **Attendance Tracking** - Core feature for foundation

### Lower Priority (Enhancements)
1. **Form Builder v2** - Current form builder is functional
2. **Scheduled Reports** - Manual exports work for now
3. **2FA** - Nice to have for security

---

## Technical Debt

1. **Email Provider Switch** - Currently using Resend, spec requires Brevo
2. **RLS Policies** - Defined in schema but not enforced at DB level
3. **Phone Normalization** - Validation exists but E.164 normalization incomplete
4. **Audit Logging** - Model exists but not consistently used
5. **Error Handling** - Could be more consistent across API endpoints
6. **Test Coverage** - Unit and integration tests need expansion

---

## Next Steps

To complete MVP (Phase 1), focus on:

1. Implement QR code generation (`GET /churches/:id/qr`)
2. Build verification queue UI page
3. Add pipeline transition endpoint with audit logging
4. Implement CSV export endpoint
5. Switch from Resend to Brevo for emails
6. Add rate limiting to public form endpoints
7. Complete E.164 phone normalization
8. Build dedupe suggestion logic using pg_trgm

Estimated effort: 3-4 weeks for full MVP completion
