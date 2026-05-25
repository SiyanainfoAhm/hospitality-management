"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
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

const staff = ["Ramesh K.", "Sunita D.", "Priya M.", "Ajay S.", "Meena R."];

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<HKTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/housekeeping")
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setTasks(data.tasks);
      })
      .catch(() => toast.error("Failed to load housekeeping tasks"))
      .finally(() => setLoading(false));
  }, []);

  const moveTask = async (taskId: string, newStatus: string) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    toast.success("Task updated!");

    await fetch("/api/housekeeping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    });
  };

  const assignTask = async (taskId: string, assignee: string) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, assignee, status: "assigned" } : t));
    toast.success(`Assigned to ${assignee}`);

    await fetch("/api/housekeeping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: "assigned", assigned_to: assignee }),
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Housekeeping</h1>
            <p className="text-sm text-gray-500">Kanban board for room cleaning and maintenance</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{tasks.length} tasks</Badge>
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
                          {col.key === "dirty" && (
                            <Select
                              className="h-6 text-[10px] w-24 py-0 px-1"
                              onChange={(e) => { if (e.target.value) assignTask(task.id, e.target.value); }}
                              defaultValue=""
                            >
                              <option value="">Assign</option>
                              {staff.map((s) => <option key={s} value={s}>{s}</option>)}
                            </Select>
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
                          {col.key === "clean" && (
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
    </AppLayout>
  );
}
