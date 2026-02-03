// File: apps/api/src/middleware/tenant-isolation.ts
// Description: Middleware that enforces tenant isolation by automatically injecting tenantId into all database queries
// Why: Ensures multi-tenant data isolation at the query level without manual tenantId handling in every route
// RELEVANT FILES: apps/api/src/lib/prisma.ts, apps/api/src/types/context.ts

import type { Context, Next } from 'hono'
import type { PrismaClient } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import type { AppBindings } from '../types/context.js'

const TENANT_ISOLATED_MODELS = new Set([
  'FirstTimer',
  'Church',
  'Form',
  'FormSubmission',
  'FollowUp',
  'ContactAttempt',
  'FoundationCourse',
  'FoundationClass',
  'FoundationEnrollment',
  'Department',
  'DepartmentEnrollment',
  'Notification',
  'VerificationCode',
])

// Cache extended clients per tenant to avoid creating new instances on every request
const tenantPrismaCache = new Map<string, PrismaClient>()

const createTenantPrisma = (tenantId: string): PrismaClient => {
  const cached = tenantPrismaCache.get(tenantId)
  if (cached) return cached

  const tenantPrisma = prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_ISOLATED_MODELS.has(model)) {
          return query(args)
        }

        const argsWithTenant = { ...(args as Record<string, unknown>) }

        switch (operation) {
          case 'findMany':
          case 'findFirst':
          case 'findUnique':
          case 'findFirstOrThrow':
          case 'findUniqueOrThrow':
          case 'count':
          case 'aggregate':
          case 'groupBy':
          case 'deleteMany':
          case 'updateMany':
          case 'update':
          case 'delete':
          case 'upsert':
            argsWithTenant.where = { ...(argsWithTenant.where as object), tenantId }
            break
          case 'create':
            argsWithTenant.data = { ...(argsWithTenant.data as object), tenantId }
            break
          case 'createMany':
            const data = argsWithTenant.data
            if (Array.isArray(data)) {
              argsWithTenant.data = data.map((item: object) => ({ ...item, tenantId }))
            }
            break
        }

        if (operation === 'upsert') {
          argsWithTenant.create = { ...(argsWithTenant.create as object), tenantId }
        }

        return query(argsWithTenant)
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
