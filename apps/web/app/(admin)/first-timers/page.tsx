// File: apps/web/app/(admin)/first-timers/page.tsx
// Description: First-timers list page with search, filtering, and pagination
// Why: Main interface for managing and viewing all first-time visitors
// RELEVANT FILES: apps/web/hooks/use-first-timers.ts, apps/web/components/ui/table.tsx

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirstTimers } from "@/hooks/use-first-timers";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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

export default function FirstTimersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { firstTimers, pagination, isLoading } = useFirstTimers({
    page,
    limit,
    search,
    statusFilter,
  });

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">First Timers</h1>
          <p className="text-gray-500">
            Manage and track all first-time visitors
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add First Timer
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {pagination.total} First Timer{pagination.total !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : firstTimers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No first timers found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {firstTimers.map((ft) => (
                    <TableRow key={ft.id}>
                      <TableCell>
                        <Link
                          href={`/first-timers/${ft.id}`}
                          className="font-medium text-gray-900 hover:text-indigo-600"
                        >
                          {ft.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {ft.email && (
                            <p className="text-sm text-gray-600">{ft.email}</p>
                          )}
                          {ft.phoneE164 && (
                            <p className="text-sm text-gray-500">
                              {ft.phoneE164}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stageColors[ft.status] || "secondary"}>
                          {ft.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">
                          {ft.church?.name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500">
                          {formatDate(ft.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="More options">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/first-timers/${ft.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page >= pagination.pages}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
