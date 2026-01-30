import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie } from 'hono/cookie';

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

    // Set httpOnly cookies for XSS protection
    const isProduction = process.env.NODE_ENV === 'production';
    setCookie(c, 'auth_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'Strict',
      path: '/',
      maxAge: 86400, // 24 hours
    });
    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'Strict',
      path: '/',
      maxAge: 604800, // 7 days
    });

    return c.json({ user: { id: user.id, name: user.name, email: user.email, tenant: user.tenant.slug, roles: payload.roleKeys } });
  });

  // Logout endpoint - clears cookies
  app.post('/auth/logout', async (c) => {
    deleteCookie(c, 'auth_token', { path: '/' });
    deleteCookie(c, 'refresh_token', { path: '/' });
    return c.json({ message: 'Logged out successfully' });
  });

  // Get current user endpoint
  app.get('/auth/me', async (c) => {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    // Verify token and return user
    const { verifyJwt } = await import('../services/jwt.js');
    const payload = await verifyJwt(token);

    if (!payload) {
      return c.json({ message: 'Invalid token' }, 401);
    }

    const prisma = c.get('prisma');
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        assignments: {
          include: {
            role: { select: { key: true } }
          }
        }
      }
    });

    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        roles: user.assignments.map(a => a.role.key)
      }
    });
  });
};
