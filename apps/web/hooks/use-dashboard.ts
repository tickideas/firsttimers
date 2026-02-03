// File: apps/web/hooks/use-dashboard.ts
// Description: SWR hook for dashboard data with caching and automatic revalidation
// Why: Provides cached dashboard data with background updates, reducing API calls and improving UX
// RELEVANT FILES: apps/web/lib/swr-config.ts, apps/web/app/(admin)/dashboard/page.tsx

import useSWR from 'swr';
import { useAuth } from '@/lib/auth';

interface DashboardStats {
  totalFirstTimers: number;
  newThisWeek: number;
  pendingFollowUps: number;
  foundationEnrolled: number;
}

interface RecentFirstTimer {
  id: string;
  fullName: string;
  status: string;
  createdAt: string;
}

export function useDashboard() {
  const { token } = useAuth();

  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR<DashboardStats>(
    token ? '/api/first-timers/stats' : null,
    {
      refreshInterval: 60000, // Refresh stats every minute
      revalidateOnFocus: true,
    }
  );

  const { data: recentData, error: recentError, isLoading: recentLoading } = useSWR<{
    firstTimers: RecentFirstTimer[];
  }>(
    token ? '/api/first-timers?limit=5' : null,
    {
      refreshInterval: 30000, // Refresh recent list every 30 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    stats: stats ?? {
      totalFirstTimers: 0,
      newThisWeek: 0,
      pendingFollowUps: 0,
      foundationEnrolled: 0,
    },
    recentFirstTimers: recentData?.firstTimers ?? [],
    isLoading: statsLoading || recentLoading,
    error: statsError || recentError,
  };
}
