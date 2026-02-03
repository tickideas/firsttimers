// File: apps/web/app/login/page.tsx
// Description: Server-side login page that fetches churches and renders login form
// Why: Uses React Server Component for data fetching, reducing client-side JS and improving load time
// RELEVANT FILES: apps/web/app/login/_components/login-form.tsx, apps/web/lib/api.ts

import type { Metadata } from "next";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Login | CE FirstTouch",
  description: "Sign in to your church admin dashboard",
};

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

async function getChurches(): Promise<Tenant[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/auth/tenants`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      console.error("Failed to fetch churches:", response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching churches:", error);
    return [];
  }
}

export default async function LoginPage() {
  const churches = await getChurches();

  return <LoginForm churches={churches} />;
}
