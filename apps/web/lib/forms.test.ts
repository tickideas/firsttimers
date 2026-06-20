// File: apps/web/lib/forms.test.ts
// Description: Unit tests for the public first-timer form helpers (phone + payload)
// Why: The public form is external-facing and must never silently submit malformed data;
//      these tests lock down phone normalisation and the optional-field payload shape
// RELEVANT FILES: apps/web/lib/forms.ts, apps/web/app/f/[churchSlug]/[formId]/page.tsx

import { describe, it, expect } from 'bun:test'

import { formatPhoneE164, buildSubmissionPayload } from './forms.js'

describe('formatPhoneE164', () => {
  it('prefixes a plain digit string with +', () => {
    expect(formatPhoneE164('1234567890')).toBe('+1234567890')
  })

  it('strips spaces, dashes, and parentheses', () => {
    expect(formatPhoneE164('(123) 456-7890')).toBe('+1234567890')
  })

  it('keeps already-prefixed numbers in E.164 form', () => {
    expect(formatPhoneE164('+1 234 567 890')).toBe('+1234567890')
  })

  it('does not double the + prefix', () => {
    expect(formatPhoneE164('++1234')).toBe('+1234')
  })
})

describe('buildSubmissionPayload', () => {
  const base = { churchSlug: 'grace', formId: 'form-1', consent: true }

  it('includes required fields and defaults fullName to empty string', () => {
    expect(buildSubmissionPayload(base)).toEqual({
      churchSlug: 'grace',
      formId: 'form-1',
      fullName: '',
      consent: true,
    })
  })

  it('omits optional contact fields when not provided', () => {
    const payload = buildSubmissionPayload(base)
    expect('email' in payload).toBe(false)
    expect('phoneE164' in payload).toBe(false)
  })

  it('includes email when provided', () => {
    const payload = buildSubmissionPayload({ ...base, email: 'a@b.com' })
    expect(payload.email).toBe('a@b.com')
  })

  it('normalises phone to E.164 when provided', () => {
    const payload = buildSubmissionPayload({ ...base, phoneE164: '(123) 456-7890' })
    expect(payload.phoneE164).toBe('+1234567890')
  })

  it('preserves fullName and consent=false', () => {
    const payload = buildSubmissionPayload({ ...base, fullName: 'Jane Doe', consent: false })
    expect(payload.fullName).toBe('Jane Doe')
    expect(payload.consent).toBe(false)
  })
})
