// File: apps/api/src/__tests__/jwt.test.ts
// Description: Round-trip tests for JWT signing and verification (issuer/audience/expiry)
// Why: Token integrity underpins all authentication; these tests guard against signature,
//      claim, and expiry regressions that would otherwise only surface as auth outages
// RELEVANT FILES: apps/api/src/services/jwt.ts, apps/api/src/config/env.ts

import { describe, it, expect } from 'bun:test'
import { SignJWT, type JWTPayload } from 'jose'

import { signAccessToken, signRefreshToken, verifyJwt } from '../services/jwt.js'
import type { JwtPayload } from '../types/jwt.js'

const payload: JwtPayload = {
  sub: 'user-123',
  tenantId: 'tenant-abc',
  roleKeys: ['church_admin'],
  scope: { type: 'church', id: 'church-1' },
}

describe('jwt sign/verify', () => {
  it('round-trips an access token preserving claims', async () => {
    const token = await signAccessToken(payload)
    const decoded = await verifyJwt<JwtPayload & JWTPayload>(token)

    expect(decoded.sub).toBe(payload.sub)
    expect(decoded.tenantId).toBe(payload.tenantId)
    expect(decoded.roleKeys).toEqual(payload.roleKeys)
    expect(decoded.scope).toEqual(payload.scope)
    expect(decoded.iss).toBe('firsttimers-api')
    expect(decoded.aud).toBe('firsttimers-admin')
    expect(typeof decoded.exp).toBe('number')
  })

  it('round-trips a refresh token', async () => {
    const token = await signRefreshToken(payload)
    const decoded = await verifyJwt(token)
    expect(decoded.sub).toBe(payload.sub)
  })

  it('rejects a tampered token', async () => {
    const token = await signAccessToken(payload)
    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'bb' : 'aa')
    await expect(verifyJwt(tampered)).rejects.toThrow()
  })

  it('rejects a token signed with a different secret', async () => {
    const wrongSecret = new TextEncoder().encode('a-different-secret-with-32-plus-characters')
    const foreign = await new SignJWT({ sub: 'x', tenantId: 't', roleKeys: [] })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('firsttimers-api')
      .setAudience('firsttimers-admin')
      .setExpirationTime('15m')
      .sign(wrongSecret)

    await expect(verifyJwt(foreign)).rejects.toThrow()
  })

  it('rejects a token with the wrong issuer/audience', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string)
    const foreign = await new SignJWT({ sub: 'x', tenantId: 't', roleKeys: [] })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('someone-else')
      .setAudience('someone-else')
      .setExpirationTime('15m')
      .sign(secret)

    await expect(verifyJwt(foreign)).rejects.toThrow()
  })

  it('rejects an expired token', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string)
    const expired = await new SignJWT({ sub: 'x', tenantId: 't', roleKeys: [] })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setIssuer('firsttimers-api')
      .setAudience('firsttimers-admin')
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
      .sign(secret)

    await expect(verifyJwt(expired)).rejects.toThrow()
  })
})
