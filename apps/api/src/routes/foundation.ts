import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Prisma } from '@prisma/client';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import type { App } from '../app.js';

// Helper to convert Zod output to Prisma's expected Json type
const toPrismaJson = (value: unknown): Prisma.InputJsonValue => {
  return value as Prisma.InputJsonValue;
};

const courseSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

const classSchema = z.object({
  courseId: z.string(),
  churchId: z.string(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  schedule: z.record(z.unknown()).optional(),
});

const enrollmentSchema = z.object({
  firstTimerId: z.string(),
  classId: z.string(),
  status: z.enum(['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED']).optional(),
});

export function registerFoundationRoutes(app: App) {
  // ============ COURSES ============

  // List courses
  app.get('/api/foundation/courses', requireAuth, async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')
    if (!user) return c.json({ message: 'Unauthorized' }, 401)
    const tenantId = user.tenantId

    const courses = await prisma.foundationCourse.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { classes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({ data: courses });
  });

  // Get course by ID
  app.get('/api/foundation/courses/:id', requireAuth, async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')
    if (!user) return c.json({ message: 'Unauthorized' }, 401)
    const tenantId = user.tenantId
    const { id } = c.req.param();

    const course = await prisma.foundationCourse.findFirst({
      where: { id, tenantId },
      include: {
        classes: {
          include: {
            church: { select: { name: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    if (!course) {
      return c.json({ message: 'Course not found' }, 404);
    }

    return c.json(course);
  });

  // Create course
  app.post(
    '/api/foundation/courses',
    requireAuth,
    requireRoles(['super_admin', 'zonal_admin', 'foundation_coordinator']),
    zValidator('json', courseSchema),
    async (c) => {
      const prisma = c.get('prisma')
      const user = c.get('authUser')
    if (!user) return c.json({ message: 'Unauthorized' }, 401)
    const tenantId = user.tenantId
      const data = c.req.valid('json');

      const course = await prisma.foundationCourse.create({
        data: {
          ...data,
          tenantId,
        },
      });

      return c.json(course, 201);
    }
  );

  // Update course
  app.put(
    '/api/foundation/courses/:id',
    requireAuth,
    requireRoles(['super_admin', 'zonal_admin', 'foundation_coordinator']),
    zValidator('json', courseSchema.partial()),
    async (c) => {
      const prisma = c.get('prisma')
      const user = c.get('authUser')
    if (!user) return c.json({ message: 'Unauthorized' }, 401)
    const tenantId = user.tenantId
      const { id } = c.req.param();
      const data = c.req.valid('json');

      const course = await prisma.foundationCourse.updateMany({
        where: { id, tenantId },
        data,
      });

      if (course.count === 0) {
        return c.json({ message: 'Course not found' }, 404);
      }

      return c.json({ message: 'Course updated' });
    }
  );

  // Delete course
  app.delete(
    '/api/foundation/courses/:id',
    requireAuth,
    requireRoles(['super_admin', 'zonal_admin']),
    async (c) => {
      const prisma = c.get('prisma')
      const user = c.get('authUser')
    if (!user) return c.json({ message: 'Unauthorized' }, 401)
    const tenantId = user.tenantId
      const { id } = c.req.param();

      await prisma.foundationCourse.deleteMany({
        where: { id, tenantId },
      });

      return c.json({ message: 'Course deleted' });
    }
  );

  // ============ CLASSES ============

  // List classes
  app.get('/api/foundation/classes', requireAuth, async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')
    if (!user) return c.json({ message: 'Unauthorized' }, 401)
    const tenantId = user.tenantId
    const { courseId, churchId } = c.req.query();

    const classes = await prisma.foundationClass.findMany({
      where: {
        course: { tenantId },
        ...(courseId && { courseId }),
        ...(churchId && { churchId }),
      },
      include: {
        course: { select: { id: true, name: true } },
        church: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { startsAt: 'desc' },
    });

    return c.json({ data: classes });
  });

  // Get class by ID
  app.get('/api/foundation/classes/:id', requireAuth, async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')
    if (!user) return c.json({ message: 'Unauthorized' }, 401)
    const tenantId = user.tenantId
    const { id } = c.req.param();

    const foundationClass = await prisma.foundationClass.findFirst({
      where: {
        id,
        course: { tenantId },
      },
      include: {
        course: true,
        church: true,
        enrollments: {
          include: {
            firstTimer: {
              select: { id: true, fullName: true, email: true, phoneE164: true },
            },
          },
        },
      },
    });

    if (!foundationClass) {
      return c.json({ message: 'Class not found' }, 404);
    }

    return c.json(foundationClass);
  });

  // Create class
  app.post(
    '/api/foundation/classes',
    requireAuth,
    requireRoles(['super_admin', 'zonal_admin', 'church_admin', 'foundation_coordinator']),
    zValidator('json', classSchema),
    async (c) => {
      const prisma = c.get('prisma')
      const data = c.req.valid('json');

      const foundationClass = await prisma.foundationClass.create({
        data: {
          courseId: data.courseId,
          churchId: data.churchId,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          endsAt: data.endsAt ? new Date(data.endsAt) : null,
          schedule: data.schedule ? toPrismaJson(data.schedule) : undefined,
        },
        include: {
          course: { select: { name: true } },
          church: { select: { name: true } },
        },
      });

      return c.json(foundationClass, 201);
    }
  );

  // ============ ENROLLMENTS ============

  // List enrollments
  app.get('/api/foundation/enrollments', requireAuth, async (c) => {
    const prisma = c.get('prisma')
    const user = c.get('authUser')
    if (!user) return c.json({ message: 'Unauthorized' }, 401)
    const tenantId = user.tenantId
    const { classId, firstTimerId } = c.req.query();

    const enrollments = await prisma.foundationEnrollment.findMany({
      where: {
        firstTimer: { tenantId },
        ...(classId && { classId }),
        ...(firstTimerId && { firstTimerId }),
      },
      include: {
        firstTimer: {
          select: { id: true, fullName: true, email: true, phoneE164: true },
        },
        class: {
          include: {
            course: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({ data: enrollments });
  });

  // Create enrollment
  app.post(
    '/api/foundation/enrollments',
    requireAuth,
    requireRoles(['super_admin', 'zonal_admin', 'church_admin', 'foundation_coordinator']),
    zValidator('json', enrollmentSchema),
    async (c) => {
      const prisma = c.get('prisma')
      const user = c.get('authUser')
    if (!user) return c.json({ message: 'Unauthorized' }, 401)
    const tenantId = user.tenantId
      const data = c.req.valid('json');

      // Verify first timer belongs to tenant
      const firstTimer = await prisma.firstTimer.findFirst({
        where: { id: data.firstTimerId, tenantId },
      });

      if (!firstTimer) {
        return c.json({ message: 'First timer not found' }, 404);
      }

      const enrollment = await prisma.foundationEnrollment.create({
        data: {
          firstTimerId: data.firstTimerId,
          classId: data.classId,
          status: data.status || 'ENROLLED',
        },
        include: {
          firstTimer: { select: { fullName: true } },
          class: {
            include: { course: { select: { name: true } } },
          },
        },
      });

      // Update first timer status
      await prisma.firstTimer.update({
        where: { id: data.firstTimerId },
        data: { status: 'FOUNDATION_ENROLLED' },
      });

      return c.json(enrollment, 201);
    }
  );

  // Update enrollment
  app.put(
    '/api/foundation/enrollments/:id',
    requireAuth,
    zValidator('json', z.object({
      status: z.enum(['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED']),
      attendance: z.record(z.unknown()).optional(),
    })),
    async (c) => {
      const prisma = c.get('prisma')
      const { id } = c.req.param();
      const data = c.req.valid('json');

      const enrollment = await prisma.foundationEnrollment.update({
        where: { id },
        data: {
          status: data.status,
          attendance: data.attendance ? toPrismaJson(data.attendance) : undefined,
        },
      });

      // Update first timer status based on enrollment status
      if (data.status === 'COMPLETED') {
        await prisma.firstTimer.update({
          where: { id: enrollment.firstTimerId },
          data: { status: 'FOUNDATION_COMPLETED' },
        });
      } else if (data.status === 'IN_PROGRESS') {
        await prisma.firstTimer.update({
          where: { id: enrollment.firstTimerId },
          data: { status: 'FOUNDATION_IN_CLASS' },
        });
      }

      return c.json(enrollment);
    }
  );
}
