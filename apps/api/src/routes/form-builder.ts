import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import type { App } from '../app.js';

const formFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'email', 'tel', 'number', 'date', 'select', 'checkbox', 'textarea']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional()
  }).optional()
});

const createFormSchema = z.object({
  churchId: z.string().cuid2(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1),
  active: z.boolean().default(true)
});

const updateFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1).optional(),
  active: z.boolean().optional()
});

const formQuerySchema = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().int().min(1).default(1)),
  limit: z.string().optional().transform(Number).pipe(z.number().int().min(1).max(100).default(20)),
  churchId: z.string().optional(),
  active: z.enum(['true', 'false']).optional().transform(val => val === 'true')
});

export const registerFormBuilderRoutes = (app: App) => {
  app.get('/api/forms', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), zValidator('query', formQuerySchema), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const { page, limit, churchId, active } = c.req.valid('query');

    const where: any = {
      tenantId: user.tenantId
    };

    if (churchId) {
      where.churchId = churchId;
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        include: {
          church: {
            select: { id: true, name: true, slug: true }
          },
          submissions: {
            select: { id: true },
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.form.count({ where })
    ]);

    return c.json({
      forms: forms.map(form => ({
        ...form,
        submissionCount: form.submissions.length,
        schemaJson: undefined
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  });

  app.get('/api/forms/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');

    const form = await prisma.form.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        church: {
          select: { id: true, name: true, slug: true }
        },
        submissions: {
          select: { id: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!form) {
      return c.json({ message: 'Form not found' }, 404);
    }

    return c.json({
      form: {
        ...form,
        submissionCount: form.submissions.length
      }
    });
  });

  app.post('/api/forms', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), zValidator('json', createFormSchema), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const { churchId, title, description, fields, active } = c.req.valid('json');

    const church = await prisma.church.findFirst({
      where: {
        id: churchId,
        tenantId: user.tenantId
      }
    });

    if (!church) {
      return c.json({ message: 'Church not found' }, 404);
    }

    const formData = {
      title: title.trim(),
      description: description?.trim(),
      schemaJson: {
        title,
        description,
        fields: fields.map(field => ({
          ...field,
          validation: field.validation || {}
        }))
      }
    };

    const form = await prisma.form.create({
      data: {
        tenantId: user.tenantId,
        churchId,
        ...formData,
        active: active ?? true
      },
      include: {
        church: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    return c.json({
      form: {
        ...form,
        schemaJson: undefined
      },
      message: 'Form created successfully'
    });
  });

  app.put('/api/forms/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), zValidator('json', updateFormSchema), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const updateData = c.req.valid('json');

    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingForm) {
      return c.json({ message: 'Form not found' }, 404);
    }

    const updatePayload: any = {};

    if (updateData.title !== undefined) updatePayload.title = updateData.title;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.active !== undefined) updatePayload.active = updateData.active;
    if (updateData.fields !== undefined) {
      const existingSchema = existingForm.schemaJson as any;
      updatePayload.schemaJson = {
        title: updateData.title || existingSchema?.title || '',
        description: updateData.description || existingSchema?.description || '',
        fields: updateData.fields.map(field => ({
          ...field,
          validation: field.validation || {}
        }))
      };
    }

    const updatedForm = await prisma.form.update({
      where: { id },
      data: updatePayload,
      include: {
        church: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    return c.json({
      form: {
        ...updatedForm,
        schemaJson: undefined
      },
      message: 'Form updated successfully'
    });
  });

  app.delete('/api/forms/:id', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');

    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingForm) {
      return c.json({ message: 'Form not found' }, 404);
    }

    await prisma.form.delete({
      where: { id }
    });

    return c.json({ message: 'Form deleted successfully' });
  });

  app.post('/api/forms/:id/duplicate', requireAuth(), requireRoles(['super_admin', 'zonal_admin', 'group_admin', 'church_admin']), async (c) => {
    const user = c.get('authUser');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const { title } = await c.req.json();

    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingForm) {
      return c.json({ message: 'Form not found' }, 404);
    }

    const existingSchema = existingForm.schemaJson as any;
    const duplicateData: any = {
        tenantId: user.tenantId,
        churchId: existingForm.churchId,
        title: title ? title.trim() : `${existingSchema?.title || ''} (Copy)`,
        description: existingSchema?.description,
        schemaJson: existingSchema,
        active: false
      };

    const duplicatedForm = await prisma.form.create({
      data: duplicateData,
      include: {
        church: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    return c.json({
      form: {
        ...duplicatedForm,
        schemaJson: undefined
      },
      message: 'Form duplicated successfully'
    });
  });

  app.get('/api/forms/field-types', requireAuth(), async (c) => {
    const fieldTypes = [
      { value: 'text', label: 'Text', description: 'Single line text input' },
      { value: 'email', label: 'Email', description: 'Email address input' },
      { value: 'tel', label: 'Phone', description: 'Phone number input' },
      { value: 'number', label: 'Number', description: 'Numeric input' },
      { value: 'date', label: 'Date', description: 'Date picker' },
      { value: 'select', label: 'Dropdown', description: 'Single select dropdown' },
      { value: 'checkbox', label: 'Checkbox', description: 'Single checkbox' },
      { value: 'textarea', label: 'Text Area', description: 'Multi-line text input' }
    ];

    return c.json({ fieldTypes });
  });
};