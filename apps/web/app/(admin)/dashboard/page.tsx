"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { StatsCard } from "@/components/admin/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  MessageSquare,
  GraduationCap,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface DashboardStats {
  totalFirstTimers: number;
  newThisWeek: number;
  pendingFollowUps: number;
  foundationEnrolled: number;
}

const stageColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  NEW: "default",
  VERIFIED: "secondary",
  CONTACTED: "secondary",
  IN_PROGRESS: "warning",
  FOUNDATION_ENROLLED: "success",
  FOUNDATION_IN_CLASS: "success",
  FOUNDATION_COMPLETED: "success",
  DEPARTMENT_ONBOARDING: "warning",
  ACTIVE_MEMBER: "success",
  DORMANT: "destructive",
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalFirstTimers: 0,
    newThisWeek: 0,
    pendingFollowUps: 0,
    foundationEnrolled: 0,
  });
  const [recentFirstTimers, setRecentFirstTimers] = useState<Array<{
    id: string;
    fullName: string;
    status: string;
    createdAt: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!token) return;

      try {
        // Fetch stats from dedicated endpoint (server-side aggregation)
        const statsResponse = await api.get<{
          totalFirstTimers: number;
          newThisWeek: number;
          pendingFollowUps: number;
          foundationEnrolled: number;
        }>("/api/first-timers/stats", { token });

        setStats(statsResponse);

        // Fetch recent first-timers for display
        const recentResponse = await api.get<{
          firstTimers: Array<{
            id: string;
            fullName: string;
            status: string;
            createdAt: string;
          }>;
        }>("/api/first-timers?limit=5", { token });

        setRecentFirstTimers(recentResponse.firstTimers || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Button asChild>
          <Link href="/first-timers">
            <UserPlus className="h-4 w-4 mr-2" />
            Add First Timer
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total First Timers"
          value={stats.totalFirstTimers}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="New This Week"
          value={stats.newThisWeek}
          icon={UserPlus}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Pending Follow-Ups"
          value={stats.pendingFollowUps}
          icon={MessageSquare}
          description="Requires attention"
        />
        <StatsCard
          title="Foundation Enrolled"
          value={stats.foundationEnrolled}
          icon={GraduationCap}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent First Timers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent First Timers</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/first-timers">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentFirstTimers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No first timers yet
              </p>
            ) : (
              <div className="space-y-4">
                {recentFirstTimers.map((ft) => (
                  <div
                    key={ft.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-700 font-medium text-sm">
                          {ft.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {ft.fullName}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(ft.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={stageColors[ft.status] || "secondary"}>
                      {ft.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { stage: "New", count: stats.pendingFollowUps, color: "bg-blue-500" },
                { stage: "In Progress", count: 12, color: "bg-yellow-500" },
                { stage: "Foundation", count: stats.foundationEnrolled, color: "bg-green-500" },
                { stage: "Active Members", count: 45, color: "bg-indigo-500" },
              ].map((item) => (
                <div key={item.stage} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.stage}</span>
                    <span className="font-medium text-gray-900">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{
                        width: `${Math.min(
                          (item.count / stats.totalFirstTimers) * 100 || 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
