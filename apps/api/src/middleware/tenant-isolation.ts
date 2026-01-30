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

export const tenantIsolation = async (c: Context<AppBindings>, next: Next) => {
  const user = c.get('authUser')

  if (!user) {
    c.set('prisma', prisma)
    return next()
  }

  const tenantId = user.tenantId

  const tenantPrisma = prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_ISOLATED_MODELS.has(model)) {
          return query(args)
        }

        const argsWithTenant = args as Record<string, unknown>

        if (
          operation === 'findMany' ||
          operation === 'findFirst' ||
          operation === 'findUnique' ||
          operation === 'findFirstOrThrow' ||
          operation === 'findUniqueOrThrow' ||
          operation === 'count' ||
          operation === 'aggregate' ||
          operation === 'groupBy' ||
          operation === 'deleteMany' ||
          operation === 'updateMany'
        ) {
          argsWithTenant.where = { ...argsWithTenant.where as object, tenantId }
        }

        if (operation === 'update' || operation === 'delete') {
          argsWithTenant.where = { ...argsWithTenant.where as object, tenantId }
        }

        if (operation === 'create') {
          argsWithTenant.data = { ...argsWithTenant.data as object, tenantId }
        }

        if (operation === 'createMany') {
          const data = argsWithTenant.data
          if (Array.isArray(data)) {
            argsWithTenant.data = data.map((item: object) => ({ ...item, tenantId }))
          }
        }

        if (operation === 'upsert') {
          argsWithTenant.where = { ...argsWithTenant.where as object, tenantId }
          argsWithTenant.create = { ...argsWithTenant.create as object, tenantId }
        }

        return query(argsWithTenant)
      },
    },
  }) as unknown as PrismaClient

  c.set('prisma', tenantPrisma)
  return next()
}
