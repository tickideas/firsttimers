'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel';
  required: boolean;
}

interface FormSchema {
  title: string;
  fields: FormField[];
}

interface FormData {
  id: string;
  version: number;
  schema: FormSchema;
  church: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function FirstTimerForm() {
  const params = useParams();
  const churchSlug = params.churchSlug as string;
  const formId = params.formId as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);

  const fetchForm = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/f/${churchSlug}/${formId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Form not found');
        }
        throw new Error('Failed to load form');
      }
      const data = await response.json();
      setForm(data.form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [churchSlug, formId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const handleInputChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const formatPhoneE164 = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      return '+234' + digits.slice(1);
    }
    if (!digits.startsWith('+')) {
      return '+' + digits;
    }
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !consent) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, string | boolean> = {
        churchSlug,
        formId,
        fullName: formValues.fullName || '',
        consent,
      };

      if (formValues.email) {
        payload.email = formValues.email;
      }

      if (formValues.phoneE164) {
        payload.phoneE164 = formatPhoneE164(formValues.phoneE164);
      }

      const response = await fetch(`http://localhost:3001/f/${churchSlug}/${formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          throw new Error('You have already registered with this email or phone number');
        }
        throw new Error(data.message || 'Failed to submit form');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading form...</div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">!</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Form Not Available</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 mb-4">
              Welcome to {form?.church.name}! Your registration has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500">
              Someone from our team will reach out to you soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-indigo-600 px-6 py-8 text-center">
            <h1 className="text-2xl font-bold text-white">
              {form?.schema.title || 'First Timer Registration'}
            </h1>
            <p className="text-indigo-100 mt-2">{form?.church.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {form?.schema.fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  required={field.required}
                  value={formValues[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
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

            <button
              type="submit"
              disabled={submitting || !consent}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by First Timers
        </p>
      </div>
    </div>
  );
}
