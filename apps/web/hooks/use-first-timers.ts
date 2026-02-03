// File: apps/web/hooks/use-first-timers.ts
// Description: SWR hook for first-timers list with search, filter, and pagination
// Why: Provides cached first-timer data with optimistic updates and background revalidation
// RELEVANT FILES: apps/web/lib/swr-config.ts, apps/web/app/(admin)/first-timers/page.tsx

import useSWR from 'swr';
import { useAuth } from '@/lib/auth';
import { useCallback } from 'react';

interface FirstTimer {
  id: string;
  fullName: string;
  email: string | null;
  phoneE164: string | null;
  status: string;
  createdAt: string;
  church?: {
    name: string;
  };
}

interface FirstTimersResponse {
  firstTimers: FirstTimer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface UseFirstTimersOptions {
  page: number;
  limit: number;
  search?: string;
  statusFilter?: string;
}

export function useFirstTimers({
  page,
  limit,
  search,
  statusFilter,
}: UseFirstTimersOptions) {
  const { token } = useAuth();

  // Build query string
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.set('search', search);
  if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

  const key = token ? `/api/first-timers?${params.toString()}` : null;

  const { data, error, isLoading, mutate } = useSWR<FirstTimersResponse>(key, {
    keepPreviousData: true, // Show old data while fetching new page
    revalidateOnFocus: false, // Don't revalidate on focus for list pages
  });

  // Optimistic update helper
  const updateFirstTimer = useCallback(
    async (id: string, updates: Partial<FirstTimer>) => {
      if (!data) return;

      // Optimistically update local data
      const updatedFirstTimers = data.firstTimers.map((ft) =>
        ft.id === id ? { ...ft, ...updates } : ft
      );

      // Update cache immediately
      mutate(
        {
          ...data,
          firstTimers: updatedFirstTimers,
        },
        false // Don't revalidate yet
      );

      // Return mutate function for actual API call
      return mutate;
    },
    [data, mutate]
  );

  return {
    firstTimers: data?.firstTimers ?? [],
    pagination: data?.pagination ?? { total: 0, page: 1, limit, pages: 1 },
    isLoading,
    error,
    mutate,
    updateFirstTimer,
  };
}
