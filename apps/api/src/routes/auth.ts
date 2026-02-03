// File: apps/api/src/routes/auth.ts
// Description: Authentication routes including login, logout, and current user endpoints
// Why: Handles user authentication with JWT tokens and secure cookie management
// RELEVANT FILES: apps/api/src/services/jwt.ts, apps/api/src/utils/password.ts, apps/api/src/middleware/auth.ts

import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie } from 'hono/cookie';
import { rateLimiter } from 'hono-rate-limiter';

import { signAccessToken, signRefreshToken } from '../services/jwt.js';
import { verifyPassword } from '../utils/password.js';
import { requireAuth } from '../middleware/auth.js';
import type { App } from '../app.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().min(1)
});

// Rate limiter for auth endpoints - prevents brute force attacks
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per window
  standardHeaders: true,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
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

  app.post('/auth/login', authLimiter, zValidator('json', loginSchema), async (c) => {
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

  // Get current user endpoint - uses requireAuth middleware to avoid duplicate JWT verification
  app.get('/auth/me', requireAuth(), async (c) => {
    const user = c.get('authUser')!
    const prisma = c.get('prisma')

    const userDetails = await prisma.user.findUnique({
      where: { id: user.sub },
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

    if (!userDetails) {
      return c.json({ message: 'User not found' }, 404);
    }

    return c.json({
      user: {
        id: userDetails.id,
        email: userDetails.email,
        name: userDetails.name,
        tenantId: userDetails.tenantId,
        roles: userDetails.assignments.map(a => a.role.key)
      }
    });
  });
};
