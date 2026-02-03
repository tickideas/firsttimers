// File: apps/api/src/routes/first-timers.ts
// Description: API routes for first-timer management with CRUD operations and statistics
// Why: Handles all first-timer related operations with proper validation, authorization, and tenant isolation
// RELEVANT FILES: apps/api/src/middleware/auth.ts, apps/api/src/app.ts, apps/api/src/lib/prisma.ts

import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Prisma, PipelineStage } from '@prisma/client';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import type { App } from '../app.js';

const firstTimerQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? Number(val) : 1).pipe(z.number().int().min(1)),
  limit: z.string().optional().transform((val) => val ? Number(val) : 20).pipe(z.number().int().min(1).max(100)),
  status: z.enum(['NEW', 'VERIFIED', 'CONTACTED', 'IN_PROGRESS', 'FOUNDATION_ENROLLED', 'FOUNDATION_IN_CLASS', 'FOUNDATION_COMPLETED', 'DEPARTMENT_ONBOARDING', 'ACTIVE_MEMBER', 'DORMANT']).optional(),
  search: z.string().optional()
});

const updateFirstTimerSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phoneE164: z.string().regex(/^\+\d{10,15}$/).optional(),
  status: z.enum(['NEW', 'VERIFIED', 'CONTACTED', 'IN_PROGRESS', 'FOUNDATION_ENROLLED', 'FOUNDATION_IN_CLASS', 'FOUNDATION_COMPLETED', 'DEPARTMENT_ONBOARDING', 'ACTIVE_MEMBER', 'DORMANT']).optional(),
  notes: z.record(z.any()).optional()
});

const buildWhereClause = (
  tenantId: string,
  status?: string,
  search?: string
): Prisma.FirstTimerWhereInput => {
  const where: Prisma.FirstTimerWhereInput = { tenantId }

  if (status) {
    where.status = status as PipelineStage
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phoneE164: { contains: search } }
    ]
  }

  return where
}

export const registerFirstTimerRoutes = (app: App) => {
  app.get('/api/first-timers', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'verifier', 'followup_agent']), zValidator('query', firstTimerQuerySchema), async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')!
    const { page, limit, status, search } = c.req.valid('query')

    const where = buildWhereClause(user.tenantId, status, search)

    const [firstTimers, total] = await Promise.all([
      prisma.firstTimer.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneE164: true,
          status: true,
          createdAt: true,
          church: {
            select: { id: true, name: true, slug: true }
          },
          followUps: {
            select: {
              id: true,
              currentStage: true,
              priority: true,
              assignedTo: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.firstTimer.count({ where })
    ])

    return c.json({
      firstTimers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  })

  app.get('/api/first-timers/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'verifier', 'followup_agent']), async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')!
    const id = c.req.param('id')

    const firstTimer = await prisma.firstTimer.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        church: {
          select: { id: true, name: true, slug: true }
        },
        submissions: {
          include: {
            form: {
              select: { id: true, version: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        followUps: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true }
            },
            contactAttempts: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!firstTimer) {
      return c.json({ message: 'First timer not found' }, 404)
    }

    return c.json({ firstTimer })
  })

  app.put('/api/first-timers/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'verifier']), zValidator('json', updateFirstTimerSchema), async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')!
    const id = c.req.param('id')
    const updateData = c.req.valid('json')

    const existingFirstTimer = await prisma.firstTimer.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existingFirstTimer) {
      return c.json({ message: 'First timer not found' }, 404)
    }

    const updatePayload: Prisma.FirstTimerUpdateInput = {}

    if (updateData.fullName !== undefined) updatePayload.fullName = updateData.fullName
    if (updateData.email !== undefined) updatePayload.email = updateData.email.toLowerCase()
    if (updateData.phoneE164 !== undefined) updatePayload.phoneE164 = updateData.phoneE164
    if (updateData.status !== undefined) updatePayload.status = updateData.status
    if (updateData.notes !== undefined) updatePayload.notes = updateData.notes

    const updatedFirstTimer = await prisma.firstTimer.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        status: true,
        notes: true,
        updatedAt: true
      }
    })

    return c.json({
      firstTimer: updatedFirstTimer,
      message: 'First timer updated successfully'
    })
  })

  app.delete('/api/first-timers/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')!
    const id = c.req.param('id')

    const existingFirstTimer = await prisma.firstTimer.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existingFirstTimer) {
      return c.json({ message: 'First timer not found' }, 404)
    }

    await prisma.firstTimer.delete({
      where: { id }
    })

    return c.json({ message: 'First timer deleted successfully' })
  })

  app.get('/api/first-timers/stats', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'verifier', 'followup_agent']), async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')!

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [totals, byStatus] = await Promise.all([
      prisma.$queryRaw<Array<{
        total_first_timers: bigint
        new_this_week: bigint
        pending_followups: bigint
        foundation_enrolled: bigint
      }>>`
        SELECT
          COUNT(*) as total_first_timers,
          COUNT(*) FILTER (WHERE created_at >= ${weekAgo}) as new_this_week,
          COUNT(*) FILTER (WHERE status IN ('NEW', 'VERIFIED', 'CONTACTED')) as pending_followups,
          COUNT(*) FILTER (WHERE status IN ('FOUNDATION_ENROLLED', 'FOUNDATION_IN_CLASS', 'FOUNDATION_COMPLETED')) as foundation_enrolled
        FROM first_timers
        WHERE tenant_id = ${user.tenantId}
      `,
      prisma.firstTimer.groupBy({
        by: ['status'],
        where: { tenantId: user.tenantId },
        _count: { id: true }
      })
    ])

    const stats = totals[0]

    return c.json({
      totalFirstTimers: Number(stats.total_first_timers),
      newThisWeek: Number(stats.new_this_week),
      pendingFollowUps: Number(stats.pending_followups),
      foundationEnrolled: Number(stats.foundation_enrolled),
      byStatus: byStatus.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {} as Record<string, number>)
    })
  })
}
