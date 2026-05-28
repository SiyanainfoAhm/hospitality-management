"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Sparkles,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/useAuth";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface HKTask {
  id: string;
  room: string;
  floor: number;
  status: string;
  priority: string;
  assignee: string | null;
  notes: string;
  time: string;
}

const columns = [
  { key: "dirty", label: "Dirty", color: "border-red-200 bg-red-50", icon: AlertTriangle, iconColor: "text-red-500" },
  { key: "assigned", label: "Assigned", color: "border-amber-200 bg-amber-50", icon: User, iconColor: "text-amber-500" },
  { key: "cleaning", label: "Cleaning", color: "border-blue-200 bg-blue-50", icon: Sparkles, iconColor: "text-blue-500" },
  { key: "clean", label: "Clean", color: "border-green-200 bg-green-50", icon: CheckCircle, iconColor: "text-green-500" },
  { key: "inspected", label: "Inspected", color: "border-emerald-200 bg-emerald-50", icon: CheckCircle, iconColor: "text-emerald-600" },
  { key: "under_repair", label: "Under Repair", color: "border-purple-200 bg-purple-50", icon: Wrench, iconColor: "text-purple-500" },
];


const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

interface StaffUser {
  id: string;
  full_name: string;
}

export default function HousekeepingPage() {
  const { hasPermission, role } = useAuth();
  const [tasks, setTasks] = useState<HKTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [hkStaff, setHkStaff] = useState<StaffUser[]>([]);
  const [rooms, setRooms] = useState<{ id: string; room_number: string }[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    room_id: "",
    assigned_to: "",
    task_type: "cleaning",
    priority: "normal",
    notes: "",
    due_date: "",
  });

  const loadTasks = () => {
    fetch("/api/housekeeping")
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setTasks(data.tasks);
      })
      .catch(() => toast.error("Failed to load housekeeping tasks"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
    if (hasPermission("housekeeping", "assign")) {
      fetch("/api/users/staff?role=housekeeping")
        .then((res) => res.json())
        .then((data) => {
          if (data.users) setHkStaff(data.users);
        });
      fetch("/api/rooms")
        .then((res) => res.json())
        .then((data) => {
          if (data.rooms) {
            setRooms(
              data.rooms.map((r: { id: string; room_number: string }) => ({
                id: r.id,
                room_number: r.room_number,
              }))
            );
          }
        });
    }
  }, [hasPermission]);

  const moveTask = async (taskId: string, newStatus: string) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    toast.success("Task updated!");

    await fetch("/api/housekeeping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    });
  };

  const assignTask = async (taskId: string, assigneeId: string) => {
    const name = hkStaff.find((s) => s.id === assigneeId)?.full_name ?? "staff";
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, assignee: name, status: "assigned" } : t
      )
    );
    toast.success(`Assigned to ${name}`);

    await fetch("/api/housekeeping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: taskId,
        status: "assigned",
        assigned_to: assigneeId,
      }),
    });
  };

  const createAssignment = async () => {
    if (!assignForm.room_id || !assignForm.assigned_to) {
      toast.error("Room and assignee are required");
      return;
    }
    const res = await fetch("/api/housekeeping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignForm),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to assign task");
      return;
    }
    toast.success("Task assigned");
    setAssignOpen(false);
    loadTasks();
  };

  if (loading) {
    return (
      <AppLayout module="housekeeping">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout module="housekeeping">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Housekeeping</h1>
            <p className="text-sm text-gray-500">Kanban board for room cleaning and maintenance</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{tasks.length} tasks</Badge>
            <PermissionGate module="housekeeping" action="assign">
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Assign Task
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="space-y-3">
                <div className={cn("rounded-lg border p-3", col.color)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <col.icon className={cn("h-4 w-4", col.iconColor)} />
                      <span className="text-sm font-semibold">{col.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{colTasks.length}</Badge>
                  </div>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {colTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold">Room {task.room}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", priorityColors[task.priority] || priorityColors.normal)}>
                            {task.priority}
                          </span>
                        </div>
                        {task.notes && (
                          <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">{task.notes}</p>
                        )}
                        {task.assignee && (
                          <p className="text-[11px] text-gray-600 flex items-center gap-1 mb-2">
                            <User className="h-3 w-3" /> {task.assignee}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {task.time}
                          </span>
                          {col.key === "dirty" && hasPermission("housekeeping", "assign") && (
                            <div className="w-44">
                              <SearchableSelect
                                options={hkStaff.map((s) => ({
                                  label: s.full_name,
                                  value: s.id,
                                }))}
                                value=""
                                onChange={(v) => {
                                  if (v) assignTask(task.id, v);
                                }}
                                placeholder="Assign"
                                searchPlaceholder="Search staff..."
                                emptyText="No staff found"
                                className="h-6 px-2 text-[10px]"
                              />
                            </div>
                          )}
                          {col.key === "assigned" && (
                            <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => moveTask(task.id, "cleaning")}>
                              Start <ArrowRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                          {col.key === "cleaning" && (
                            <Button size="sm" className="h-6 text-[10px] px-2" variant="gold" onClick={() => moveTask(task.id, "clean")}>
                              Done <CheckCircle className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                          {col.key === "clean" &&
                            hasPermission("housekeeping", "assign") && (
                            <Button size="sm" className="h-6 text-[10px] px-2" variant="outline" onClick={() => moveTask(task.id, "inspected")}>
                              Inspect
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Housekeeping Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Room</label>
              <div className="mt-1">
                <SearchableSelect
                  options={rooms.map((r) => ({
                    label: `Room ${r.room_number}`,
                    value: r.id,
                  }))}
                  value={assignForm.room_id}
                  onChange={(v) => setAssignForm({ ...assignForm, room_id: v })}
                  placeholder="Select room"
                  searchPlaceholder="Search room number..."
                  emptyText="No room found"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Assign to</label>
              <div className="mt-1">
                <SearchableSelect
                  options={hkStaff.map((s) => ({
                    label: s.full_name,
                    value: s.id,
                    description: "Housekeeping",
                  }))}
                  value={assignForm.assigned_to}
                  onChange={(v) =>
                    setAssignForm({ ...assignForm, assigned_to: v })
                  }
                  placeholder="Select staff"
                  searchPlaceholder="Search staff..."
                  emptyText="No staff found"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Task type</label>
              <div className="mt-1">
                <SearchableSelect
                  options={[
                    { label: "Cleaning", value: "cleaning" },
                    { label: "Inspection", value: "inspection" },
                    { label: "Linen change", value: "linen_change" },
                    { label: "Deep cleaning", value: "deep_cleaning" },
                  ]}
                  value={assignForm.task_type}
                  onChange={(v) =>
                    setAssignForm({ ...assignForm, task_type: v })
                  }
                  placeholder="Select task type"
                  searchPlaceholder="Search task type..."
                  emptyText="No task type found"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <div className="mt-1">
                <SearchableSelect
                  options={[
                    { label: "Low", value: "low" },
                    { label: "Normal", value: "normal" },
                    { label: "High", value: "high" },
                    { label: "Urgent", value: "urgent" },
                  ]}
                  value={assignForm.priority}
                  onChange={(v) =>
                    setAssignForm({ ...assignForm, priority: v })
                  }
                  placeholder="Select priority"
                  searchPlaceholder="Search priority..."
                  emptyText="No priority found"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                className="mt-1"
                value={assignForm.notes}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, notes: e.target.value })
                }
              />
            </div>
            <Button className="w-full" onClick={createAssignment}>
              Assign Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
