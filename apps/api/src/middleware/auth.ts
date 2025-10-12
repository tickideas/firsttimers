import type { Context, Next } from 'hono';

import type { AppBindings } from '../types/context.js';
import type { JwtPayload } from '../types/jwt.js';
import { verifyJwt } from '../services/jwt.js';
import { logger } from '../lib/logger.js';

const parseToken = (header?: string | null) => {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
};

export const authenticate = async (c: Context<AppBindings>, next: Next) => {
  const token = parseToken(c.req.header('authorization'));
  if (!token) {
    return next();
  }

  try {
    const payload = await verifyJwt<JwtPayload>(token);
    c.set('authUser', payload);
  } catch (error) {
    logger.warn({ err: error }, 'Failed to verify access token');
  }

  return next();
};

export const requireRoles = (roles: string[]) =>
  async (c: Context<AppBindings>, next: Next) => {
    const user = c.get('authUser');
    if (!user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const hasRole = user.roleKeys.some((role) => roles.includes(role));
    if (!hasRole) {
      return c.json({ message: 'Forbidden' }, 403);
    }

    return next();
  };

export const requireAuth = () => async (c: Context<AppBindings>, next: Next) => {
  if (!c.get('authUser')) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  return next();
};
