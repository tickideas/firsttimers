import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { rateLimiter } from 'hono-rate-limiter';
import { PHONE_E164_REGEX } from '@firsttimers/types';

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
  phoneE164: z.string().regex(PHONE_E164_REGEX).optional(),
  // GDPR consent is mandatory: reject submissions where consent isn't granted
  // rather than silently storing PII without it.
  consent: z.literal(true),
  metadata: z.record(z.string(), z.any()).optional()
});

// Rate-limit the internet-facing form submit to curb spam / bulk-record abuse.
const publicSubmitLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  keyGenerator: (c) =>
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
});

export const registerPublicFormRoutes = (app: App) => {
  // Public endpoint to get churches with active forms for general registration
  app.get('/churches/public', async (c) => {
    const prisma = c.get('prisma')

    const churches = await prisma.church.findMany({
      where: {
        forms: {
          some: { active: true }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        tenant: {
          select: {
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return c.json({ churches })
  })

  // Get active form for a church (for general registration page)
  app.get('/churches/:churchSlug/active-form', async (c) => {
    const prisma = c.get('prisma')
    const churchSlug = c.req.param('churchSlug')

    const church = await prisma.church.findFirst({
      where: { slug: churchSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        tenantId: true,
        forms: {
          where: { active: true },
          orderBy: { version: 'desc' },
          take: 1,
          select: {
            id: true,
            version: true,
            schemaJson: true
          }
        }
      }
    })

    if (!church) {
      return c.json({ message: 'Church not found' }, 404)
    }

    const form = church.forms[0]
    if (!form) {
      return c.json({ message: 'No active form for this church' }, 404)
    }

    return c.json({
      form: {
        id: form.id,
        version: form.version,
        schema: form.schemaJson,
        church: {
          id: church.id,
          name: church.name,
          slug: church.slug
        }
      }
    })
  })

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

  app.post('/f/:churchSlug/:formId', publicSubmitLimiter, zValidator('param', getFormSchema), zValidator('json', submitFormSchema), async (c) => {
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

    // Only create a follow-up if this first-timer doesn't already have one.
    // Prevents a double-submit / retry from generating duplicate follow-up
    // tasks (staff chasing the same person twice).
    const existingFollowUp = await prisma.followUp.findFirst({
      where: { firstTimerId: firstTimer.id },
      select: { id: true }
    });

    if (!existingFollowUp) {
      await prisma.followUp.create({
        data: {
          tenantId: church.tenantId,
          firstTimerId: firstTimer.id,
          currentStage: 'NEW',
          priority: 'normal'
        },
        select: { id: true }
      });
    }

    return c.json({
      success: true,
      submissionId: submission.id,
      message: 'Form submitted successfully'
    })
  })
}