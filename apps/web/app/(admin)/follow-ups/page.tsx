"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Mail,
  MessageSquare,
  User,
  Clock,
  Plus,
  LayoutGrid,
  List,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface FollowUp {
  id: string;
  currentStage: string;
  priority: string;
  dueAt: string | null;
  createdAt: string;
  firstTimer: {
    id: string;
    fullName: string;
    email: string | null;
    phoneE164: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
  contactAttempts: Array<{
    id: string;
    channel: string;
    outcome: string;
    createdAt: string;
  }>;
}

const STAGES = [
  { key: "NEW", label: "New", color: "bg-blue-500" },
  { key: "CONTACTED", label: "Contacted", color: "bg-yellow-500" },
  { key: "IN_PROGRESS", label: "In Progress", color: "bg-orange-500" },
  { key: "FOUNDATION_ENROLLED", label: "Foundation", color: "bg-green-500" },
];

const priorityColors: Record<string, string> = {
  high: "destructive",
  normal: "secondary",
  low: "outline",
};

export default function FollowUpsPage() {
  const { token } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [contactForm, setContactForm] = useState({
    channel: "phone",
    outcome: "reached",
    notes: "",
  });

  const fetchFollowUps = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get<{
        followUps: FollowUp[];
      }>("/api/follow-ups?limit=100", { token });
      setFollowUps(response.followUps || []);
    } catch (error) {
      console.error("Failed to fetch follow-ups:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const handleLogContact = async () => {
    if (!token || !selectedFollowUp) return;

    try {
      await api.post(
        `/api/follow-ups/${selectedFollowUp.id}/attempts`,
        contactForm,
        { token }
      );
      setContactModalOpen(false);
      setContactForm({ channel: "phone", outcome: "reached", notes: "" });
      fetchFollowUps();
    } catch (error) {
      console.error("Failed to log contact:", error);
    }
  };

  const getFollowUpsByStage = (stage: string) =>
    followUps.filter((fu) => fu.currentStage === stage);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
          <p className="text-gray-500">
            Track and manage visitor follow-up activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
            <TabsList>
              <TabsTrigger value="kanban">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-4">
          {STAGES.map((stage) => (
            <div key={stage.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                <h3 className="font-medium text-gray-700">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {getFollowUpsByStage(stage.key).length}
                </Badge>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {getFollowUpsByStage(stage.key).map((followUp) => (
                  <Card key={followUp.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <Link
                          href={`/first-timers/${followUp.firstTimer.id}`}
                          className="font-medium text-gray-900 hover:text-indigo-600"
                        >
                          {followUp.firstTimer.fullName}
                        </Link>
                        <Badge variant={priorityColors[followUp.priority] as "destructive" | "secondary" | "outline"}>
                          {followUp.priority}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        {followUp.firstTimer.phoneE164 && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {followUp.firstTimer.phoneE164}
                          </div>
                        )}
                        {followUp.firstTimer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {followUp.firstTimer.email}
                          </div>
                        )}
                      </div>
                      {followUp.assignedTo && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <User className="h-3 w-3" />
                          {followUp.assignedTo.name}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(followUp.createdAt)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedFollowUp(followUp);
                            setContactModalOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Log
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {getFollowUpsByStage(stage.key).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No follow-ups
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Follow-Ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {followUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-700 font-medium text-sm">
                        {followUp.firstTimer.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <Link
                        href={`/first-timers/${followUp.firstTimer.id}`}
                        className="font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {followUp.firstTimer.fullName}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline">
                          {followUp.currentStage.replace(/_/g, " ")}
                        </Badge>
                        {followUp.assignedTo && (
                          <span>• {followUp.assignedTo.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityColors[followUp.priority] as "destructive" | "secondary" | "outline"}>
                      {followUp.priority}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFollowUp(followUp);
                        setContactModalOpen(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Log Contact
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Log Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Contact Attempt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Channel</label>
              <Select
                value={contactForm.channel}
                onValueChange={(v) =>
                  setContactForm({ ...contactForm, channel: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Outcome</label>
              <Select
                value={contactForm.outcome}
                onValueChange={(v) =>
                  setContactForm({ ...contactForm, outcome: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reached">Reached</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="voicemail">Left Voicemail</SelectItem>
                  <SelectItem value="wrong_number">Wrong Number</SelectItem>
                  <SelectItem value="scheduled">Scheduled Callback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                placeholder="Add notes about this contact..."
                value={contactForm.notes}
                onChange={(e) =>
                  setContactForm({ ...contactForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogContact}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
