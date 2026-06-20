// File: apps/api/src/__tests__/auth.test.ts
// Description: Unit tests for auth middleware helpers (token parsing and role guards)
// Why: Authorization is security-critical; these pure helpers must be locked down by tests
//      so role drift or token-parsing regressions fail CI instead of shipping silently
// RELEVANT FILES: apps/api/src/middleware/auth.ts, apps/api/src/types/jwt.ts

import { describe, it, expect } from 'bun:test'
import type { Context, Next } from 'hono'

import {
  parseToken,
  requireRoles,
  requireAuth,
  ALL_ADMIN_ROLES,
  FIRST_TIMER_VIEW_ROLES,
  FOLLOWUP_ROLES,
} from '../middleware/auth.js'
import type { AppBindings } from '../types/context.js'
import type { JwtPayload } from '../types/jwt.js'

type JsonCall = { body: unknown; status?: number }

const createContext = (authUser?: JwtPayload) => {
  const jsonCalls: JsonCall[] = []
  const store = new Map<string, unknown>()
  if (authUser) store.set('authUser', authUser)

  const c = {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
    json: (body: unknown, status?: number) => {
      jsonCalls.push({ body, status })
      return { body, status } as unknown
    },
  } as unknown as Context<AppBindings>

  return { c, jsonCalls }
}

const createNext = () => {
  let called = false
  const next = (async () => {
    called = true
  }) as unknown as Next
  return { next, wasCalled: () => called }
}

const user = (roleKeys: string[]): JwtPayload => ({
  sub: 'user-1',
  tenantId: 'tenant-1',
  roleKeys,
})

describe('parseToken', () => {
  it('extracts a bearer token', () => {
    expect(parseToken('Bearer abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('is case-insensitive on the scheme', () => {
    expect(parseToken('bearer token123')).toBe('token123')
    expect(parseToken('BEARER token123')).toBe('token123')
  })

  it('trims trailing whitespace from the token', () => {
    expect(parseToken('Bearer token123  ')).toBe('token123')
  })

  it('returns null for missing or malformed headers', () => {
    expect(parseToken(undefined)).toBeNull()
    expect(parseToken(null)).toBeNull()
    expect(parseToken('')).toBeNull()
    expect(parseToken('token-without-scheme')).toBeNull()
    expect(parseToken('Basic abc123')).toBeNull()
    expect(parseToken('Bearer')).toBeNull()
  })
})

describe('requireRoles', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const { c, jsonCalls } = createContext()
    const { next, wasCalled } = createNext()

    await requireRoles(['super_admin'])(c, next)

    expect(wasCalled()).toBe(false)
    expect(jsonCalls).toEqual([{ body: { message: 'Unauthorized' }, status: 401 }])
  })

  it('rejects users without a matching role with 403', async () => {
    const { c, jsonCalls } = createContext(user(['verifier']))
    const { next, wasCalled } = createNext()

    await requireRoles(['super_admin'])(c, next)

    expect(wasCalled()).toBe(false)
    expect(jsonCalls).toEqual([{ body: { message: 'Forbidden' }, status: 403 }])
  })

  it('allows users that hold at least one required role', async () => {
    const { c, jsonCalls } = createContext(user(['followup_agent', 'verifier']))
    const { next, wasCalled } = createNext()

    await requireRoles(FOLLOWUP_ROLES)(c, next)

    expect(wasCalled()).toBe(true)
    expect(jsonCalls).toEqual([])
  })
})

describe('requireAuth', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const { c, jsonCalls } = createContext()
    const { next, wasCalled } = createNext()

    await requireAuth()(c, next)

    expect(wasCalled()).toBe(false)
    expect(jsonCalls).toEqual([{ body: { message: 'Unauthorized' }, status: 401 }])
  })

  it('passes through authenticated requests', async () => {
    const { c, jsonCalls } = createContext(user(['verifier']))
    const { next, wasCalled } = createNext()

    await requireAuth()(c, next)

    expect(wasCalled()).toBe(true)
    expect(jsonCalls).toEqual([])
  })
})

describe('role groups', () => {
  it('FIRST_TIMER_VIEW_ROLES extends the admin roles', () => {
    for (const role of ALL_ADMIN_ROLES) {
      expect(FIRST_TIMER_VIEW_ROLES).toContain(role)
    }
    expect(FIRST_TIMER_VIEW_ROLES).toContain('verifier')
    expect(FIRST_TIMER_VIEW_ROLES).toContain('followup_agent')
  })

  it('FOLLOWUP_ROLES includes admins plus followup agents only', () => {
    for (const role of ALL_ADMIN_ROLES) {
      expect(FOLLOWUP_ROLES).toContain(role)
    }
    expect(FOLLOWUP_ROLES).toContain('followup_agent')
    expect(FOLLOWUP_ROLES).not.toContain('verifier')
  })
})
