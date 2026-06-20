// File: apps/api/src/middleware/tenant-isolation.ts
// Description: Middleware that enforces tenant isolation by automatically injecting tenantId into all database queries
// Why: Ensures multi-tenant data isolation at the query level without manual tenantId handling in every route
// RELEVANT FILES: apps/api/src/lib/prisma.ts, apps/api/src/types/context.ts

import type { Context, Next } from 'hono'
import type { PrismaClient } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import type { AppBindings } from '../types/context.js'

// Only models that actually have a `tenantId` column. Relation-only models
// (FormSubmission, ContactAttempt, FoundationClass, FoundationEnrollment,
// DepartmentEnrollment) are NOT listed here: stamping tenantId onto them throws
// a Prisma validation error. Their isolation is enforced via parent-relation
// filters in the routes (e.g. `where: { firstTimer: { tenantId } }`).
export const TENANT_ISOLATED_MODELS = new Set([
  'FirstTimer',
  'Church',
  'Form',
  'FollowUp',
  'FoundationCourse',
  'Department',
  'Notification',
  'VerificationCode',
])

export const isTenantIsolatedModel = (model?: string): boolean =>
  !!model && TENANT_ISOLATED_MODELS.has(model)

// Operations whose `where` clause must be scoped to the current tenant.
const WHERE_SCOPED_OPERATIONS = new Set([
  'findMany',
  'findFirst',
  'findUnique',
  'findFirstOrThrow',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'deleteMany',
  'updateMany',
  'update',
  'delete',
  'upsert',
])

// Pure transformation that stamps `tenantId` onto the right part of a Prisma
// query's args for tenant isolation. Extracted so the security-critical logic
// can be unit-tested without a live database. Returns a new object; the input
// args are never mutated.
export const applyTenantScope = (
  operation: string,
  args: unknown,
  tenantId: string,
): Record<string, unknown> => {
  const next = { ...(args as Record<string, unknown>) }

  if (WHERE_SCOPED_OPERATIONS.has(operation)) {
    next.where = { ...(next.where as object), tenantId }
  } else if (operation === 'create') {
    next.data = { ...(next.data as object), tenantId }
  } else if (operation === 'createMany') {
    const data = next.data
    if (Array.isArray(data)) {
      next.data = data.map((item: object) => ({ ...item, tenantId }))
    }
  }

  // upsert also needs tenantId on the create branch (where is handled above).
  if (operation === 'upsert') {
    next.create = { ...(next.create as object), tenantId }
  }

  return next
}

// Cache extended clients per tenant to avoid creating new instances on every request
const tenantPrismaCache = new Map<string, PrismaClient>()

const createTenantPrisma = (tenantId: string): PrismaClient => {
  const cached = tenantPrismaCache.get(tenantId)
  if (cached) return cached

  const tenantPrisma = prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!isTenantIsolatedModel(model)) {
          return query(args)
        }

        return query(applyTenantScope(operation, args, tenantId))
      },
    },
  }) as unknown as PrismaClient

  // Limit cache size to prevent memory leaks (LRU eviction)
  if (tenantPrismaCache.size > 100) {
    const firstKey = tenantPrismaCache.keys().next().value
    if (firstKey) {
      tenantPrismaCache.delete(firstKey)
    }
  }

  tenantPrismaCache.set(tenantId, tenantPrisma)
  return tenantPrisma
}

export const tenantIsolation = async (c: Context<AppBindings>, next: Next) => {
  const user = c.get('authUser')

  if (!user) {
    c.set('prisma', prisma)
    return next()
  }

  c.set('prisma', createTenantPrisma(user.tenantId))
  return next()
}
