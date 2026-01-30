import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import type { App } from '../app.js';

type PipelineStage = 'NEW' | 'VERIFIED' | 'CONTACTED' | 'IN_PROGRESS' | 'FOUNDATION_ENROLLED' | 'FOUNDATION_IN_CLASS' | 'FOUNDATION_COMPLETED' | 'DEPARTMENT_ONBOARDING' | 'ACTIVE_MEMBER' | 'DORMANT';

const followUpQuerySchema = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().int().min(1).default(1)),
  limit: z.string().optional().transform(Number).pipe(z.number().int().min(1).max(100).default(20)),
  status: z.enum(['NEW', 'VERIFIED', 'CONTACTED', 'IN_PROGRESS', 'FOUNDATION_ENROLLED', 'FOUNDATION_IN_CLASS', 'FOUNDATION_COMPLETED', 'DEPARTMENT_ONBOARDING', 'ACTIVE_MEMBER', 'DORMANT']).optional(),
  assignedTo: z.string().optional()
});

const assignFollowUpSchema = z.object({
  assignedToId: z.string().cuid2().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  notes: z.record(z.any()).optional()
});

const contactAttemptSchema = z.object({
  channel: z.enum(['email', 'phone', 'sms', 'whatsapp', 'in_person']),
  outcome: z.enum(['successful', 'unsuccessful', 'pending', 'callback_requested']),
  notes: z.string().optional(),
  nextActionAt: z.string().datetime().optional()
});

const updateFollowUpSchema = z.object({
  currentStage: z.enum(['NEW', 'VERIFIED', 'CONTACTED', 'IN_PROGRESS', 'FOUNDATION_ENROLLED', 'FOUNDATION_IN_CLASS', 'FOUNDATION_COMPLETED', 'DEPARTMENT_ONBOARDING', 'ACTIVE_MEMBER', 'DORMANT']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedToId: z.string().cuid2().optional()
});

export const registerFollowUpRoutes = (app: App) => {
  app.get('/api/follow-ups', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'followup_agent']), zValidator('query', followUpQuerySchema), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const { page, limit, status, assignedTo } = c.req.valid('query');

    const where: any = {
      tenantId: user.tenantId
    };

    if (status) {
      where.currentStage = status;
    }

    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        include: {
          firstTimer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneE164: true,
              church: {
                select: { id: true, name: true, slug: true }
              }
            }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          },
          contactAttempts: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: { contactAttempts: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.followUp.count({ where })
    ]);

    return c.json({
      followUps,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  });

  app.get('/api/follow-ups/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'followup_agent']), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');

    const followUp = await prisma.followUp.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        firstTimer: {
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
            }
          }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        contactAttempts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!followUp) {
      return c.json({ message: 'Follow up not found' }, 404);
    }

    return c.json({ followUp });
  });

  app.post('/api/follow-ups', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), zValidator('json', assignFollowUpSchema), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const { firstTimerId, assignedToId, priority, notes } = await c.req.json();

    const firstTimer = await prisma.firstTimer.findFirst({
      where: {
        id: firstTimerId,
        tenantId: user.tenantId
      }
    });

    if (!firstTimer) {
      return c.json({ message: 'First timer not found' }, 404);
    }

    if (assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          tenantId: user.tenantId
        }
      });

      if (!assignedUser) {
        return c.json({ message: 'Assigned user not found' }, 404);
      }
    }

    const followUp = await prisma.followUp.create({
      data: {
        tenantId: user.tenantId,
        firstTimerId,
        assignedToId,
        priority: priority || 'normal',
        currentStage: 'NEW',
        notes
      },
      include: {
        firstTimer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneE164: true
          }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return c.json({
      followUp,
      message: 'Follow up created successfully'
    });
  });

  app.put('/api/follow-ups/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'followup_agent']), zValidator('json', updateFollowUpSchema), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const updateData = c.req.valid('json');

    const existingFollowUp = await prisma.followUp.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingFollowUp) {
      return c.json({ message: 'Follow up not found' }, 404);
    }

    if (updateData.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: updateData.assignedToId,
          tenantId: user.tenantId
        }
      });

      if (!assignedUser) {
        return c.json({ message: 'Assigned user not found' }, 404);
      }
    }

    const updatePayload: any = {};
    
    if (updateData.currentStage !== undefined) updatePayload.currentStage = updateData.currentStage;
    if (updateData.priority !== undefined) updatePayload.priority = updateData.priority;
    if (updateData.assignedToId !== undefined) updatePayload.assignedToId = updateData.assignedToId;

    const updatedFollowUp = await prisma.followUp.update({
      where: { id },
      data: updatePayload,
      include: {
        firstTimer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneE164: true
          }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return c.json({
      followUp: updatedFollowUp,
      message: 'Follow up updated successfully'
    });
  });

  app.post('/api/follow-ups/:id/attempts', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin', 'followup_agent']), zValidator('json', contactAttemptSchema), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const { channel, outcome, notes, nextActionAt } = c.req.valid('json');

    const followUp = await prisma.followUp.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!followUp) {
      return c.json({ message: 'Follow up not found' }, 404);
    }

    const contactAttempt = await prisma.contactAttempt.create({
      data: {
        followUpId: id,
        channel,
        outcome,
        notes,
        nextActionAt: nextActionAt ? new Date(nextActionAt) : undefined
      }
    });

    if (outcome === 'successful') {
      let nextStage: PipelineStage = 'CONTACTED';
      if (followUp.currentStage === 'NEW') {
        nextStage = 'CONTACTED';
      } else if (followUp.currentStage === 'CONTACTED') {
        nextStage = 'IN_PROGRESS';
      }

      await prisma.followUp.update({
        where: { id },
        data: { 
          currentStage: nextStage,
          dueAt: nextActionAt ? new Date(nextActionAt) : undefined
        }
      });
    }

    return c.json({
      contactAttempt,
      message: 'Contact attempt recorded successfully'
    });
  });

  app.get('/api/follow-ups/stats', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);

    const stats = await prisma.followUp.groupBy({
      by: ['currentStage'],
      where: {
        tenantId: user.tenantId
      },
      _count: {
        id: true
      }
    });

    const priorityStats = await prisma.followUp.groupBy({
      by: ['priority'],
      where: {
        tenantId: user.tenantId
      },
      _count: {
        id: true
      }
    });

    const totalFollowUps = await prisma.followUp.count({
      where: {
        tenantId: user.tenantId
      }
    });

    const unassignedCount = await prisma.followUp.count({
      where: {
        tenantId: user.tenantId,
        assignedToId: null
      }
    });

    return c.json({
      total: totalFollowUps,
      unassigned: unassignedCount,
      byStage: stats.reduce((acc, stat) => {
        acc[stat.currentStage as string] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = stat._count.id;
        return acc;
      }, {} as Record<string, number>)
    });
  });
};