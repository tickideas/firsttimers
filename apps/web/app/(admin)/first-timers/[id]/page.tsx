"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  MessageSquare,
  GraduationCap,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

interface FirstTimerDetail {
  id: string;
  fullName: string;
  email: string | null;
  phoneE164: string | null;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  consent: boolean;
  notes: Record<string, unknown> | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  church: {
    id: string;
    name: string;
  };
  followUps: Array<{
    id: string;
    currentStage: string;
    priority: string;
    createdAt: string;
    assignedTo?: {
      name: string;
    };
    contactAttempts: Array<{
      id: string;
      channel: string;
      outcome: string;
      notes: string | null;
      createdAt: string;
    }>;
  }>;
  foundationEnrollments: Array<{
    id: string;
    status: string;
    class: {
      id: string;
      course: {
        name: string;
      };
    };
  }>;
  departmentEnrollments: Array<{
    id: string;
    status: string;
    department: {
      id: string;
      name: string;
    };
  }>;
}

const PIPELINE_STAGES = [
  "NEW",
  "VERIFIED",
  "CONTACTED",
  "IN_PROGRESS",
  "FOUNDATION_ENROLLED",
  "FOUNDATION_IN_CLASS",
  "FOUNDATION_COMPLETED",
  "DEPARTMENT_ONBOARDING",
  "ACTIVE_MEMBER",
  "DORMANT",
];

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

export default function FirstTimerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [firstTimer, setFirstTimer] = useState<FirstTimerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchFirstTimer = useCallback(async () => {
    if (!token || !params.id) return;

    try {
      const response = await api.get<{ firstTimer: FirstTimerDetail }>(
        `/api/first-timers/${params.id}`,
        { token }
      );
      setFirstTimer(response.firstTimer);
    } catch (error) {
      console.error("Failed to fetch first timer:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, params.id]);

  useEffect(() => {
    fetchFirstTimer();
  }, [fetchFirstTimer]);

  const handleStatusChange = async (newStatus: string) => {
    if (!token || !firstTimer) return;

    setIsUpdating(true);
    try {
      await api.put(
        `/api/first-timers/${firstTimer.id}`,
        { status: newStatus },
        { token }
      );
      setFirstTimer({ ...firstTimer, status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!firstTimer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">First timer not found</p>
        <Button variant="link" asChild className="mt-4">
          <Link href="/first-timers">Back to list</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {firstTimer.fullName}
          </h1>
          <p className="text-gray-500">
            Added on {formatDate(firstTimer.createdAt)}
          </p>
        </div>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {firstTimer.email || "Not provided"}
                    </p>
                  </div>
                  {firstTimer.email && (
                    firstTimer.emailVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300" />
                    )
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">
                      {firstTimer.phoneE164 || "Not provided"}
                    </p>
                  </div>
                  {firstTimer.phoneE164 && (
                    firstTimer.phoneVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300" />
                    )
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Church</p>
                    <p className="font-medium">{firstTimer.church.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registered</p>
                    <p className="font-medium">
                      {formatDateTime(firstTimer.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Follow-ups, Foundation, Departments */}
          <Tabs defaultValue="followups">
            <TabsList>
              <TabsTrigger value="followups" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Follow-Ups ({firstTimer.followUps.length})
              </TabsTrigger>
              <TabsTrigger value="foundation" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Foundation ({firstTimer.foundationEnrollments.length})
              </TabsTrigger>
              <TabsTrigger value="departments" className="gap-2">
                <Building2 className="h-4 w-4" />
                Departments ({firstTimer.departmentEnrollments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="followups" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {firstTimer.followUps.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No follow-ups yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {firstTimer.followUps.map((followUp) => (
                        <div
                          key={followUp.id}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant={stageColors[followUp.currentStage]}>
                              {followUp.currentStage.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(followUp.createdAt)}
                            </span>
                          </div>
                          {followUp.assignedTo && (
                            <p className="text-sm text-gray-600">
                              Assigned to: {followUp.assignedTo.name}
                            </p>
                          )}
                          {followUp.contactAttempts.length > 0 && (
                            <div className="border-t pt-3 mt-3">
                              <p className="text-sm font-medium mb-2">
                                Contact History
                              </p>
                              <div className="space-y-2">
                                {followUp.contactAttempts.map((attempt) => (
                                  <div
                                    key={attempt.id}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                      <span className="font-medium capitalize">
                                        {attempt.channel}
                                      </span>
                                      <span className="text-gray-500">
                                        {" "}
                                        - {attempt.outcome}
                                      </span>
                                      {attempt.notes && (
                                        <p className="text-gray-500">
                                          {attempt.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="foundation" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {firstTimer.foundationEnrollments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Not enrolled in any foundation classes
                      </p>
                      <Button variant="outline">Enroll in Class</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {firstTimer.foundationEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {enrollment.class.course.name}
                            </p>
                          </div>
                          <Badge>{enrollment.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {firstTimer.departmentEnrollments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Not enrolled in any departments
                      </p>
                      <Button variant="outline">Add to Department</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {firstTimer.departmentEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <p className="font-medium">
                            {enrollment.department.name}
                          </p>
                          <Badge>{enrollment.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={firstTimer.status}
                onValueChange={handleStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-4 space-y-2">
                {PIPELINE_STAGES.map((stage, index) => {
                  const currentIndex = PIPELINE_STAGES.indexOf(
                    firstTimer.status
                  );
                  const isCompleted = index < currentIndex;
                  const isCurrent = index === currentIndex;

                  return (
                    <div
                      key={stage}
                      className={`flex items-center gap-2 text-sm ${
                        isCompleted
                          ? "text-green-600"
                          : isCurrent
                          ? "text-indigo-600 font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isCompleted
                            ? "bg-green-500"
                            : isCurrent
                            ? "bg-indigo-500"
                            : "bg-gray-200"
                        }`}
                      />
                      {stage.replace(/_/g, " ")}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {firstTimer.tags.length === 0 ? (
                <p className="text-gray-500 text-sm">No tags</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {firstTimer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
