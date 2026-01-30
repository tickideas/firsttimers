import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { signAccessToken, signRefreshToken } from '../services/jwt.js';
import { verifyPassword } from '../utils/password.js';
import type { App } from '../app.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().min(1)
});

export const registerAuthRoutes = (app: App) => {
  // Public endpoint to get available tenants/churches for login dropdown
  app.get('/auth/tenants', async (c) => {
    const prisma = c.get('prisma')
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    return c.json({ data: tenants });
  });

  app.post('/auth/login', zValidator('json', loginSchema), async (c) => {
    const prisma = c.get('prisma')
    const { email, password, tenantSlug } = c.req.valid('json');

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        tenant: { slug: tenantSlug }
      },
      include: {
        assignments: {
          include: {
            role: true
          }
        },
        tenant: true
      }
    });

    if (!user || !user.isActive) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      roleKeys: user.assignments.map(({ role }) => role.key)
    } as const;

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload)
    ]);

    return c.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, tenant: user.tenant.slug, roles: payload.roleKeys } });
  });
};
