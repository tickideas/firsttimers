"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GraduationCap,
  Plus,
  Users,
  Calendar,
  BookOpen,
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
import { formatDate } from "@/lib/utils";
import { StatsCard } from "@/components/admin/stats-card";

interface Course {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count?: {
    classes: number;
  };
}

interface FoundationClass {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  course: {
    id: string;
    name: string;
  };
  church: {
    name: string;
  };
  _count?: {
    enrollments: number;
  };
}

export default function FoundationPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<FoundationClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      // For now, use mock data since API routes don't exist yet
      setCourses([
        {
          id: "1",
          name: "Foundation School Level 1",
          description: "Introduction to the faith",
          createdAt: new Date().toISOString(),
          _count: { classes: 3 },
        },
        {
          id: "2",
          name: "Foundation School Level 2",
          description: "Growing in faith",
          createdAt: new Date().toISOString(),
          _count: { classes: 2 },
        },
      ]);
      setClasses([
        {
          id: "1",
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          course: { id: "1", name: "Foundation School Level 1" },
          church: { name: "Main Campus" },
          _count: { enrollments: 15 },
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch foundation data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateCourse = async () => {
    if (!token || !courseForm.name) return;

    setIsSubmitting(true);
    try {
      // API call would go here
      setCourses([
        ...courses,
        {
          id: Date.now().toString(),
          name: courseForm.name,
          description: courseForm.description,
          createdAt: new Date().toISOString(),
          _count: { classes: 0 },
        },
      ]);
      setCourseModalOpen(false);
      setCourseForm({ name: "", description: "" });
    } catch (error) {
      console.error("Failed to create course:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalEnrollments = classes.reduce(
    (sum, c) => sum + (c._count?.enrollments || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Foundation School</h1>
          <p className="text-gray-500">
            Manage courses, classes, and enrollments
          </p>
        </div>
        <Button onClick={() => setCourseModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Courses"
          value={courses.length}
          icon={BookOpen}
        />
        <StatsCard
          title="Active Classes"
          value={classes.length}
          icon={GraduationCap}
        />
        <StatsCard
          title="Total Enrolled"
          value={totalEnrollments}
          icon={Users}
        />
      </div>

      {/* Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No courses yet</p>
              <Button onClick={() => setCourseModalOpen(true)}>
                Create First Course
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="text-gray-500">
                      {course.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {course._count?.classes || 0} classes
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {formatDate(course.createdAt)}
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Classes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Classes</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active classes</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <Card key={cls.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{cls.course.name}</h4>
                        <p className="text-sm text-gray-500">{cls.church.name}</p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {cls.startsAt ? formatDate(cls.startsAt) : "TBD"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {cls._count?.enrollments || 0} enrolled
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Enrollments
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Course Modal */}
      <Dialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Course Name</label>
              <Input
                placeholder="e.g., Foundation School Level 1"
                value={courseForm.name}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description of the course..."
                value={courseForm.description}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCourseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCourse} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
