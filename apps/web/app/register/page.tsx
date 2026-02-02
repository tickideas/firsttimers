// apps/web/app/register/page.tsx
// Public first-timer registration page with church selection
// Allows users to select a church and complete registration form
// RELEVANT FILES: apps/web/app/f/[churchSlug]/[formId]/page.tsx, apps/api/src/routes/forms.ts, apps/web/app/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Church {
  id: string
  name: string
  slug: string
  tenant: {
    name: string
  }
}

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel'
  required: boolean
}

interface FormSchema {
  title: string
  fields: FormField[]
}

interface FormData {
  id: string
  version: number
  schema: FormSchema
  church: {
    id: string
    name: string
    slug: string
  }
}

export default function PublicRegisterPage() {
  const [churches, setChurches] = useState<Church[]>([])
  const [selectedChurch, setSelectedChurch] = useState<string>('')
  const [form, setForm] = useState<FormData | null>(null)
  const [loadingChurches, setLoadingChurches] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [consent, setConsent] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const response = await fetch(`${API_URL}/churches/public`)
        if (!response.ok) throw new Error('Failed to load churches')
        const data = await response.json()
        setChurches(data.churches || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load churches')
      } finally {
        setLoadingChurches(false)
      }
    }

    fetchChurches()
  }, [API_URL])

  const fetchForm = useCallback(async (churchSlug: string) => {
    setLoadingForm(true)
    setError(null)
    setForm(null)
    setFormValues({})

    try {
      const response = await fetch(`${API_URL}/churches/${churchSlug}/active-form`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No registration form available for this church')
        }
        throw new Error('Failed to load form')
      }
      const data = await response.json()
      setForm(data.form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form')
    } finally {
      setLoadingForm(false)
    }
  }, [API_URL])

  const handleChurchChange = (churchSlug: string) => {
    setSelectedChurch(churchSlug)
    if (churchSlug) {
      fetchForm(churchSlug)
    } else {
      setForm(null)
    }
  }

  const handleInputChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const formatPhoneE164 = (phone: string): string => {
    const digits = phone.replace(/\D/g, '')
    if (!digits.startsWith('+')) {
      return '+' + digits
    }
    return digits
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || !consent) return

    setSubmitting(true)
    setError(null)

    try {
      const payload: Record<string, string | boolean> = {
        churchSlug: form.church.slug,
        formId: form.id,
        fullName: formValues.fullName || '',
        consent,
      }

      if (formValues.email) {
        payload.email = formValues.email
      }

      if (formValues.phoneE164) {
        payload.phoneE164 = formatPhoneE164(formValues.phoneE164)
      }

      const response = await fetch(`${API_URL}/f/${form.church.slug}/${form.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 409) {
          throw new Error('You have already registered with this email or phone number')
        }
        throw new Error(data.message || 'Failed to submit form')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="text-green-500 text-5xl mb-4">&#10003;</div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 mb-4">
              Welcome to {form?.church.name}! Your registration has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Someone from our team will reach out to you soon.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm">
            &larr; Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center bg-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">First Timer Registration</CardTitle>
            <CardDescription className="text-indigo-100">
              Select your church and complete the form below
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="church" className="text-sm font-medium text-gray-700">
                  Select Church <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedChurch}
                  onValueChange={handleChurchChange}
                  disabled={loadingChurches}
                >
                  <SelectTrigger id="church">
                    <SelectValue
                      placeholder={loadingChurches ? 'Loading churches...' : 'Choose a church'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map((church) => (
                      <SelectItem key={church.id} value={church.slug}>
                        {church.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingForm && (
                <div className="text-center py-8 text-gray-500">Loading form...</div>
              )}

              {error && !form && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {form && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  {form.schema.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label
                        htmlFor={field.name}
                        className="text-sm font-medium text-gray-700"
                      >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        value={formValues[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={
                          field.type === 'email'
                            ? 'you@example.com'
                            : field.type === 'tel'
                              ? '+234 800 000 0000'
                              : ''
                        }
                      />
                    </div>
                  ))}

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      required
                    />
                    <label htmlFor="consent" className="ml-2 text-sm text-gray-600">
                      I consent to being contacted by the church and agree to the storage of my
                      information for follow-up purposes.
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting || !consent}
                  >
                    {submitting ? 'Submitting...' : 'Submit Registration'}
                  </Button>
                </form>
              )}

              {!selectedChurch && !loadingChurches && churches.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No churches available for registration at this time.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by CE FirstTouch
        </p>
      </div>
    </div>
  )
}
