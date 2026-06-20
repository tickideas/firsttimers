import type { Context, Next } from 'hono';
import type { RoleKey } from '@firsttimers/types';

import type { AppBindings } from '../types/context.js';
import type { JwtPayload } from '../types/jwt.js';
import { verifyJwt } from '../services/jwt.js';
import { logger } from '../lib/logger.js';

export const parseToken = (header?: string | null) => {
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

// Named role groups so route guards reference one definition instead of
// re-pasting literal role arrays (which drift and create authorization holes).
export const ALL_ADMIN_ROLES = [
  'super_admin',
  'zonal_admin',
  'group_admin',
  'church_admin',
] as const satisfies readonly RoleKey[]

export const FIRST_TIMER_VIEW_ROLES = [
  ...ALL_ADMIN_ROLES,
  'verifier',
  'followup_agent',
] as const satisfies readonly RoleKey[]

export const FOLLOWUP_ROLES = [
  ...ALL_ADMIN_ROLES,
  'followup_agent',
] as const satisfies readonly RoleKey[]

export const requireRoles = (roles: readonly RoleKey[]) =>
  async (c: Context<AppBindings>, next: Next) => {
    const user = c.get('authUser');
    if (!user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    // user.roleKeys come from the DB as untyped strings (a system boundary);
    // widen `roles` to string[] so the membership check stays type-correct.
    const allowed: readonly string[] = roles;
    const hasRole = user.roleKeys.some((role) => allowed.includes(role));
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
