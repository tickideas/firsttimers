import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import type { App } from '../app.js';

const departmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  churchId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const enrollmentSchema = z.object({
  firstTimerId: z.string(),
  departmentId: z.string(),
  status: z.enum(['INTERESTED', 'ONBOARDING', 'ACTIVE', 'INACTIVE']).optional(),
  notes: z.record(z.unknown()).optional(),
});

export function registerDepartmentRoutes(app: App) {
  // ============ DEPARTMENTS ============

  // List departments
  app.get('/api/departments', requireAuth, async (c) => {
    const tenantId = c.get('jwtPayload').tenantId;
    const { churchId } = c.req.query();

    const departments = await prisma.department.findMany({
      where: {
        tenantId,
        ...(churchId && { churchId }),
      },
      include: {
        church: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { name: 'asc' },
    });

    return c.json({ data: departments });
  });

  // Get department by ID
  app.get('/api/departments/:id', requireAuth, async (c) => {
    const tenantId = c.get('jwtPayload').tenantId;
    const { id } = c.req.param();

    const department = await prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        church: true,
        enrollments: {
          include: {
            firstTimer: {
              select: { id: true, fullName: true, email: true, phoneE164: true, status: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!department) {
      return c.json({ message: 'Department not found' }, 404);
    }

    return c.json(department);
  });

  // Create department
  app.post(
    '/api/departments',
    requireAuth,
    requireRoles(['super_admin', 'zonal_admin', 'church_admin', 'department_head']),
    zValidator('json', departmentSchema),
    async (c) => {
      const tenantId = c.get('jwtPayload').tenantId;
      const data = c.req.valid('json');

      // Check for duplicate name in the same church
      const existing = await prisma.department.findFirst({
        where: {
          tenantId,
          churchId: data.churchId,
          name: data.name,
        },
      });

      if (existing) {
        return c.json({ message: 'Department with this name already exists in this church' }, 409);
      }

      const department = await prisma.department.create({
        data: {
          ...data,
          tenantId,
        },
        include: {
          church: { select: { name: true } },
        },
      });

      return c.json(department, 201);
    }
  );

  // Update department
  app.put(
    '/api/departments/:id',
    requireAuth,
    requireRoles(['super_admin', 'zonal_admin', 'church_admin', 'department_head']),
    zValidator('json', departmentSchema.partial()),
    async (c) => {
      const tenantId = c.get('jwtPayload').tenantId;
      const { id } = c.req.param();
      const data = c.req.valid('json');

      const result = await prisma.department.updateMany({
        where: { id, tenantId },
        data,
      });

      if (result.count === 0) {
        return c.json({ message: 'Department not found' }, 404);
      }

      return c.json({ message: 'Department updated' });
    }
  );

  // Delete department
  app.delete(
    '/api/departments/:id',
    requireAuth,
    requireRoles(['super_admin', 'zonal_admin', 'church_admin']),
    async (c) => {
      const tenantId = c.get('jwtPayload').tenantId;
      const { id } = c.req.param();

      await prisma.department.deleteMany({
        where: { id, tenantId },
      });

      return c.json({ message: 'Department deleted' });
    }
  );

  // ============ ENROLLMENTS ============

  // List department enrollments
  app.get('/api/department-enrollments', requireAuth, async (c) => {
    const tenantId = c.get('jwtPayload').tenantId;
    const { departmentId, firstTimerId, status } = c.req.query();

    const enrollments = await prisma.departmentEnrollment.findMany({
      where: {
        firstTimer: { tenantId },
        ...(departmentId && { departmentId }),
        ...(firstTimerId && { firstTimerId }),
        ...(status && { status }),
      },
      include: {
        firstTimer: {
          select: { id: true, fullName: true, email: true, phoneE164: true, status: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({ data: enrollments });
  });

  // Create department enrollment
  app.post(
    '/api/department-enrollments',
    requireAuth,
    zValidator('json', enrollmentSchema),
    async (c) => {
      const tenantId = c.get('jwtPayload').tenantId;
      const data = c.req.valid('json');

      // Verify first timer belongs to tenant
      const firstTimer = await prisma.firstTimer.findFirst({
        where: { id: data.firstTimerId, tenantId },
      });

      if (!firstTimer) {
        return c.json({ message: 'First timer not found' }, 404);
      }

      // Check if already enrolled
      const existing = await prisma.departmentEnrollment.findFirst({
        where: {
          firstTimerId: data.firstTimerId,
          departmentId: data.departmentId,
        },
      });

      if (existing) {
        return c.json({ message: 'Already enrolled in this department' }, 409);
      }

      const enrollment = await prisma.departmentEnrollment.create({
        data: {
          firstTimerId: data.firstTimerId,
          departmentId: data.departmentId,
          status: data.status || 'INTERESTED',
          notes: data.notes,
        },
        include: {
          firstTimer: { select: { fullName: true } },
          department: { select: { name: true } },
        },
      });

      return c.json(enrollment, 201);
    }
  );

  // Update department enrollment
  app.put(
    '/api/department-enrollments/:id',
    requireAuth,
    zValidator('json', z.object({
      status: z.enum(['INTERESTED', 'ONBOARDING', 'ACTIVE', 'INACTIVE']),
      notes: z.record(z.unknown()).optional(),
    })),
    async (c) => {
      const { id } = c.req.param();
      const data = c.req.valid('json');

      const enrollment = await prisma.departmentEnrollment.update({
        where: { id },
        data,
      });

      // Update first timer status if becoming active
      if (data.status === 'ACTIVE') {
        await prisma.firstTimer.update({
          where: { id: enrollment.firstTimerId },
          data: { status: 'ACTIVE_MEMBER' },
        });
      } else if (data.status === 'ONBOARDING') {
        await prisma.firstTimer.update({
          where: { id: enrollment.firstTimerId },
          data: { status: 'DEPARTMENT_ONBOARDING' },
        });
      }

      return c.json(enrollment);
    }
  );

  // Delete department enrollment
  app.delete(
    '/api/department-enrollments/:id',
    requireAuth,
    async (c) => {
      const { id } = c.req.param();

      await prisma.departmentEnrollment.delete({
        where: { id },
      });

      return c.json({ message: 'Enrollment removed' });
    }
  );
}
