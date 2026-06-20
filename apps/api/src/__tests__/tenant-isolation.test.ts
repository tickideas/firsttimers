// File: apps/api/src/__tests__/tenant-isolation.test.ts
// Description: Unit tests for tenant-isolation arg-stamping (the multi-tenant safety boundary)
// Why: Cross-tenant data leakage is the worst failure mode for this app; this verifies that
//      tenantId is injected onto every query shape and never silently dropped or mutated
// RELEVANT FILES: apps/api/src/middleware/tenant-isolation.ts

import { describe, it, expect } from 'bun:test'

import {
  applyTenantScope,
  isTenantIsolatedModel,
  TENANT_ISOLATED_MODELS,
} from '../middleware/tenant-isolation.js'

const TENANT = 'tenant-xyz'

describe('isTenantIsolatedModel', () => {
  it('recognises models that carry a tenantId column', () => {
    for (const model of TENANT_ISOLATED_MODELS) {
      expect(isTenantIsolatedModel(model)).toBe(true)
    }
  })

  it('rejects relation-only models and undefined', () => {
    expect(isTenantIsolatedModel('FormSubmission')).toBe(false)
    expect(isTenantIsolatedModel('ContactAttempt')).toBe(false)
    expect(isTenantIsolatedModel('FoundationEnrollment')).toBe(false)
    expect(isTenantIsolatedModel(undefined)).toBe(false)
    expect(isTenantIsolatedModel('')).toBe(false)
  })
})

describe('applyTenantScope - where-scoped reads/writes', () => {
  const whereOps = [
    'findMany',
    'findFirst',
    'findUnique',
    'findFirstOrThrow',
    'findUniqueOrThrow',
    'count',
    'aggregate',
    'groupBy',
    'deleteMany',
    'updateMany',
    'update',
    'delete',
  ]

  for (const op of whereOps) {
    it(`stamps tenantId into where for ${op}`, () => {
      const result = applyTenantScope(op, { where: { id: '1' } }, TENANT)
      expect(result.where).toEqual({ id: '1', tenantId: TENANT })
    })
  }

  it('adds where when args have none', () => {
    const result = applyTenantScope('findMany', {}, TENANT)
    expect(result.where).toEqual({ tenantId: TENANT })
  })

  it('preserves sibling args like select/include/orderBy', () => {
    const result = applyTenantScope(
      'findMany',
      { where: { status: 'NEW' }, select: { id: true }, orderBy: { createdAt: 'desc' } },
      TENANT,
    )
    expect(result).toEqual({
      where: { status: 'NEW', tenantId: TENANT },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('applyTenantScope - create', () => {
  it('stamps tenantId into data', () => {
    const result = applyTenantScope('create', { data: { name: 'Jane' } }, TENANT)
    expect(result.data).toEqual({ name: 'Jane', tenantId: TENANT })
  })
})

describe('applyTenantScope - createMany', () => {
  it('stamps tenantId into every row', () => {
    const result = applyTenantScope(
      'createMany',
      { data: [{ name: 'A' }, { name: 'B' }] },
      TENANT,
    )
    expect(result.data).toEqual([
      { name: 'A', tenantId: TENANT },
      { name: 'B', tenantId: TENANT },
    ])
  })

  it('leaves non-array data untouched', () => {
    const result = applyTenantScope('createMany', { data: { name: 'A' } }, TENANT)
    expect(result.data).toEqual({ name: 'A' })
  })
})

describe('applyTenantScope - upsert', () => {
  it('stamps tenantId into both where and create branches', () => {
    const result = applyTenantScope(
      'upsert',
      { where: { id: '1' }, create: { name: 'Jane' }, update: { name: 'Janet' } },
      TENANT,
    )
    expect(result.where).toEqual({ id: '1', tenantId: TENANT })
    expect(result.create).toEqual({ name: 'Jane', tenantId: TENANT })
    // update branch is intentionally not stamped (row already scoped by where)
    expect(result.update).toEqual({ name: 'Janet' })
  })
})

describe('applyTenantScope - safety', () => {
  it('does not mutate the original args object', () => {
    const args = { where: { id: '1' } }
    applyTenantScope('findMany', args, TENANT)
    expect(args).toEqual({ where: { id: '1' } })
  })

  it('always forces the configured tenantId, overriding any caller-supplied one', () => {
    const result = applyTenantScope('findMany', { where: { tenantId: 'attacker' } }, TENANT)
    expect(result.where).toEqual({ tenantId: TENANT })
  })

  it('returns args unchanged for unknown operations', () => {
    const result = applyTenantScope('executeRaw', { foo: 'bar' }, TENANT)
    expect(result).toEqual({ foo: 'bar' })
  })
})
