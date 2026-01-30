import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { prisma } from '../lib/prisma.js';
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

export const registerFirstTimerRoutes = (app: App) => {
  app.get('/api/first-timers', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'verifier', 'followup_agent']), zValidator('query', firstTimerQuerySchema), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const { page, limit, status, search } = c.req.valid('query');

    const where: any = {
      tenantId: user.tenantId
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneE164: { contains: search } }
      ];
    }

    const [firstTimers, total] = await Promise.all([
      prisma.firstTimer.findMany({
        where,
        include: {
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
    ]);

    return c.json({
      firstTimers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  });

  app.get('/api/first-timers/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'verifier', 'followup_agent']), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');

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
    });

    if (!firstTimer) {
      return c.json({ message: 'First timer not found' }, 404);
    }

    return c.json({ firstTimer });
  });

  app.put('/api/first-timers/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'verifier']), zValidator('json', updateFirstTimerSchema), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const updateData = c.req.valid('json');

    const existingFirstTimer = await prisma.firstTimer.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingFirstTimer) {
      return c.json({ message: 'First timer not found' }, 404);
    }

    const updatePayload: any = {};
    
    if (updateData.fullName !== undefined) updatePayload.fullName = updateData.fullName;
    if (updateData.email !== undefined) updatePayload.email = updateData.email?.toLowerCase();
    if (updateData.phoneE164 !== undefined) updatePayload.phoneE164 = updateData.phoneE164;
    if (updateData.status !== undefined) updatePayload.status = updateData.status;
    if (updateData.notes !== undefined) updatePayload.notes = updateData.notes;

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
    });

    return c.json({
      firstTimer: updatedFirstTimer,
      message: 'First timer updated successfully'
    });
  });

  app.delete('/api/first-timers/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');

    const existingFirstTimer = await prisma.firstTimer.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingFirstTimer) {
      return c.json({ message: 'First timer not found' }, 404);
    }

    await prisma.firstTimer.delete({
      where: { id }
    });

    return c.json({ message: 'First timer deleted successfully' });
  });
};