// File: apps/web/lib/forms.ts
// Description: Pure helpers for the public first-timer form (phone normalisation + payload build)
// Why: The public form at /f/[churchSlug]/[formId] is external-facing and must never break;
//      extracting its logic here lets us unit-test the submission shape without a DOM
// RELEVANT FILES: apps/web/app/f/[churchSlug]/[formId]/page.tsx, packages/types/src/index.ts

// Normalise a user-entered phone number to E.164-ish form (leading '+').
// Non-digit characters (spaces, dashes, parentheses, a typed '+') are stripped,
// then a single '+' prefix is applied.
export const formatPhoneE164 = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  return '+' + digits
}

export interface SubmissionInput {
  churchSlug: string
  formId: string
  fullName?: string
  email?: string
  phoneE164?: string
  consent: boolean
}

// Build the JSON payload posted to the API. Optional contact fields are only
// included when provided so the API receives a clean, minimal submission.
export const buildSubmissionPayload = (
  input: SubmissionInput,
): Record<string, string | boolean> => {
  const payload: Record<string, string | boolean> = {
    churchSlug: input.churchSlug,
    formId: input.formId,
    fullName: input.fullName || '',
    consent: input.consent,
  }

  if (input.email) {
    payload.email = input.email
  }

  if (input.phoneE164) {
    payload.phoneE164 = formatPhoneE164(input.phoneE164)
  }

  return payload
}
