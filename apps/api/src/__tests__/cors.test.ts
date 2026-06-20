// File: apps/api/src/__tests__/cors.test.ts
// Description: Unit tests for the CORS origin resolver (exact + wildcard subdomain matching)
// Why: Wildcard origin matching is subtle and security-sensitive; an off-by-one in suffix
//      matching could allow attacker-controlled origins, so it must be covered by tests
// RELEVANT FILES: apps/api/src/app.ts

import { describe, it, expect } from 'bun:test'

import { buildCorsOriginResolver } from '../app.js'

describe('buildCorsOriginResolver', () => {
  it('allows exact configured origins (case-insensitive)', () => {
    const resolve = buildCorsOriginResolver(['https://app.example.com'])
    expect(resolve('https://app.example.com')).toBe('https://app.example.com')
    expect(resolve('https://APP.example.com')).toBe('https://APP.example.com')
  })

  it('rejects origins not in the allow list', () => {
    const resolve = buildCorsOriginResolver(['https://app.example.com'])
    expect(resolve('https://evil.com')).toBeNull()
    expect(resolve('http://app.example.com')).toBeNull() // scheme mismatch
  })

  it('matches wildcard subdomains for the right scheme', () => {
    const resolve = buildCorsOriginResolver(['https://*.example.com'])
    expect(resolve('https://app.example.com')).toBe('https://app.example.com')
    expect(resolve('https://deep.nested.example.com')).toBe('https://deep.nested.example.com')
  })

  it('does not let the wildcard match the apex or look-alike domains', () => {
    const resolve = buildCorsOriginResolver(['https://*.example.com'])
    // apex is not a subdomain (no leading ".example.com")
    expect(resolve('https://example.com')).toBeNull()
    // suffix attack: attacker registers notexample.com
    expect(resolve('https://app.notexample.com')).toBeNull()
    // suffix embedded as a different TLD
    expect(resolve('https://example.com.evil.com')).toBeNull()
  })

  it('enforces scheme for wildcard origins', () => {
    const resolve = buildCorsOriginResolver(['https://*.example.com'])
    expect(resolve('http://app.example.com')).toBeNull()
  })

  it('returns null for empty or malformed origins', () => {
    const resolve = buildCorsOriginResolver(['https://app.example.com'])
    expect(resolve('')).toBeNull()
    expect(resolve('not-a-url')).toBeNull()
  })

  it('handles a mix of exact and wildcard entries', () => {
    const resolve = buildCorsOriginResolver([
      'http://localhost:3000',
      'https://*.example.com',
    ])
    expect(resolve('http://localhost:3000')).toBe('http://localhost:3000')
    expect(resolve('https://team.example.com')).toBe('https://team.example.com')
    expect(resolve('http://localhost:3001')).toBeNull()
  })

  it('ignores malformed config entries without throwing', () => {
    const resolve = buildCorsOriginResolver(['', 'garbage', 'https://*.', 'https://ok.com'])
    expect(resolve('https://ok.com')).toBe('https://ok.com')
    expect(resolve('https://anything.com')).toBeNull()
  })
})
