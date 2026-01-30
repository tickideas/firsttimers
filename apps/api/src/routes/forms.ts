import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { App } from '../app.js';

const getFormSchema = z.object({
  churchSlug: z.string().min(1),
  formId: z.string().cuid()
});

const submitFormSchema = z.object({
  churchSlug: z.string().min(1),
  formId: z.string().cuid(),
  fullName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phoneE164: z.string().regex(/^\+\d{10,15}$/).optional(),
  consent: z.boolean(),
  metadata: z.record(z.any()).optional()
});

export const registerPublicFormRoutes = (app: App) => {
  app.get('/f/:churchSlug/:formId', zValidator('param', getFormSchema), async (c) => {
    const prisma = c.get('prisma')
    const { churchSlug, formId } = c.req.valid('param');

    const church = await prisma.church.findFirst({
      where: { slug: churchSlug },
      select: { id: true, name: true, tenantId: true }
    });

    if (!church) {
      return c.json({ message: 'Church not found' }, 404);
    }

    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        churchId: church.id,
        active: true
      },
      select: {
        id: true,
        version: true,
        schemaJson: true,
        church: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!form) {
      return c.json({ message: 'Form not found or inactive' }, 404);
    }

    return c.json({
      form: {
        id: form.id,
        version: form.version,
        schema: form.schemaJson,
        church: form.church
      }
    });
  });

  app.post('/f/:churchSlug/:formId', zValidator('param', getFormSchema), zValidator('json', submitFormSchema), async (c) => {
    const prisma = c.get('prisma')
    const { churchSlug, formId } = c.req.valid('param');
    const { fullName, email, phoneE164, consent, metadata } = c.req.valid('json');

    const church = await prisma.church.findFirst({
      where: { slug: churchSlug },
      select: { id: true, name: true, tenantId: true }
    });

    if (!church) {
      return c.json({ message: 'Church not found' }, 404);
    }

    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        churchId: church.id,
        active: true
      },
      select: { id: true, version: true, schemaJson: true }
    });

    if (!form) {
      return c.json({ message: 'Form not found or inactive' }, 404);
    }

    let existingFirstTimer = null
    if (email || phoneE164) {
      existingFirstTimer = await prisma.firstTimer.findFirst({
        where: {
          tenantId: church.tenantId,
          OR: [
            email ? { email: email.toLowerCase() } : {},
            phoneE164 ? { phoneE164 } : {}
          ].filter(condition => Object.keys(condition).length > 0)
        },
        select: { id: true }
      })
    }

    const firstTimer = existingFirstTimer ?? await prisma.firstTimer.create({
      data: {
        tenantId: church.tenantId,
        churchId: church.id,
        fullName: fullName.trim(),
        email: email?.toLowerCase(),
        phoneE164,
        consent,
        source: 'form',
        status: 'NEW',
        notes: metadata ? { source: metadata } : undefined
      },
      select: { id: true }
    })

    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        firstTimerId: firstTimer.id,
        payload: {
          fullName,
          email,
          phoneE164,
          consent,
          ...(metadata && { metadata })
        }
      },
      select: {
        id: true,
        createdAt: true
      }
    });

    const followUp = await prisma.followUp.create({
      data: {
        tenantId: church.tenantId,
        firstTimerId: firstTimer.id,
        currentStage: 'NEW',
        priority: 'normal'
      },
      select: {
        id: true,
        priority: true,
        currentStage: true
      }
    });

    return c.json({
      success: true,
      submissionId: submission.id,
      message: 'Form submitted successfully'
    })
  })
}