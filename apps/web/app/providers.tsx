// File: apps/web/app/providers.tsx
// Description: Root providers wrapper for authentication and data fetching
// Why: Combines all global providers (Auth, SWR) in a single component tree
// RELEVANT FILES: apps/web/lib/auth.tsx, apps/web/lib/swr-config.ts

"use client";

import { AuthProvider } from "@/lib/auth";
import { SWRProvider } from "@/lib/swr-config";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SWRProvider>{children}</SWRProvider>
    </AuthProvider>
  );
}
