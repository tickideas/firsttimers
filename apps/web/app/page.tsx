// apps/web/app/page.tsx
// Landing page for CE FirstTouch platform
// Provides two CTAs: first-timer registration and admin login
// RELEVANT FILES: apps/web/app/register/page.tsx, apps/web/app/login/page.tsx, apps/web/app/layout.tsx

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-indigo-600 mb-4">
            CE FirstTouch
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to our church first-timer management platform. We help churches 
            connect with and nurture first-time visitors on their faith journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl">I&apos;m a First Timer</CardTitle>
              <CardDescription className="text-base">
                Visiting one of our churches for the first time? Register here and 
                let us welcome you properly.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full" size="lg">
                <Link href="/register">Register as First Timer</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <CardDescription className="text-base">
                Church administrators can sign in to manage first-timer records 
                and follow-up activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/login">Sign In to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Helping churches connect with first-time visitors
          </p>
        </div>
      </div>
    </div>
  )
}
