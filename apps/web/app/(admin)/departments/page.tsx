"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatsCard } from "@/components/admin/stats-card";

interface Department {
  id: string;
  name: string;
  description: string | null;
  church: {
    id: string;
    name: string;
  };
  _count?: {
    enrollments: number;
  };
}

export default function DepartmentsPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get<{
        data: Department[];
      }>("/api/departments", { token });
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = async () => {
    if (!token || !form.name) return;

    // Get churchId from existing departments or use empty string
    const churchId = departments[0]?.church?.id;
    if (!churchId) {
      setError("No church available. Please ensure you have access to a church before creating departments.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.post<Department>("/api/departments", {
        name: form.name,
        description: form.description,
        churchId,
      }, { token });

      setDepartments([...departments, response]);
      setModalOpen(false);
      setForm({ name: "", description: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create department";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    try {
      await api.delete(`/api/departments/${id}`, { token });
      setDepartments(departments.filter((d) => d.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete department";
      setError(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalMembers = departments.reduce(
    (sum, d) => sum + (d._count?.enrollments || 0),
    0
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500">
            Manage church departments and member assignments
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Total Departments"
          value={departments.length}
          icon={Building2}
        />
        <StatsCard
          title="Total Members"
          value={totalMembers}
          icon={Users}
        />
      </div>

      {/* Departments Grid */}
      {departments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No departments yet</p>
            <Button onClick={() => setModalOpen(true)}>
              Create First Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{dept.name}</CardTitle>
                    <p className="text-xs text-gray-500">{dept.church.name}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(dept.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  {dept.description || "No description"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{dept._count?.enrollments || 0} members</span>
                  </div>
                  <Button variant="outline" size="sm">
                    View Members
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Department Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) setError(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Department Name</label>
              <Input
                placeholder="e.g., Choir, Ushering, Media"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
