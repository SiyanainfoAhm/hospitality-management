"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wrench, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/useAuth";
import { PermissionGate } from "@/components/auth/PermissionGate";

interface MaintRequest {
  id: string;
  room_id?: string;
  room: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  issue_type: string;
  assignee?: string;
  assigned_to?: string;
  material_required?: string | null;
  resolution_note?: string | null;
  work_note?: string | null;
}

interface StaffUser {
  id: string;
  full_name: string;
}

const statusColors: Record<string, string> = {
  open: "bg-gray-100 text-gray-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-emerald-100 text-emerald-800",
};

export default function MaintenancePage() {
  const { role, user, hasPermission } = useAuth();
  const [requests, setRequests] = useState<MaintRequest[]>([]);
  const [rooms, setRooms] = useState<{ id: string; room_number: string }[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    room_id: "",
    title: "",
    description: "",
    issue_type: "other",
    priority: "normal",
    assigned_to: "",
  });

  const load = () => {
    fetch("/api/maintenance")
      .then((res) => res.json())
      .then((data) => {
        if (data.requests) setRequests(data.requests);
      })
      .catch(() => toast.error("Failed to load maintenance requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
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
    if (hasPermission("maintenance", "assign")) {
      fetch("/api/users/staff?role=maintenance_staff")
        .then((res) => res.json())
        .then((data) => {
          if (data.users) setStaff(data.users);
        });
    }
  }, [hasPermission]);

  const reportIssue = async () => {
    if (!form.room_id || !form.title) {
      toast.error("Room and title are required");
      return;
    }
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to create request");
      return;
    }
    toast.success("Maintenance request created");
    setDialogOpen(false);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return;
    }
    toast.success("Status updated");
    load();
  };

  const saveWorkNote = async (id: string, work_note: string) => {
    const res = await fetch("/api/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, work_note }),
    });
    if (!res.ok) {
      toast.error("Failed to save note");
      return;
    }
    toast.success("Work note saved");
    load();
  };

  if (loading) {
    return (
      <AppLayout module="maintenance">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout module="maintenance">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-sm text-gray-500">
              {role === "maintenance_staff"
                ? "Your assigned repair jobs"
                : "Report and assign repair issues"}
            </p>
          </div>
          <PermissionGate module="maintenance" action="create">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Report Issue
            </Button>
          </PermissionGate>
        </div>

        <div className="grid gap-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                No maintenance requests
              </CardContent>
            </Card>
          ) : (
            requests.map((req) => (
              <Card key={req.id}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-[#D4A017]" />
                      Room {req.room} — {req.title}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {req.issue_type} · {req.priority}
                      {req.assignee ? ` · ${req.assignee}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full capitalize",
                      statusColors[req.status] ?? statusColors.open
                    )}
                  >
                    {req.status.replace("_", " ")}
                  </span>
                </CardHeader>
                <CardContent>
                  {req.description && (
                    <p className="text-sm text-gray-600 mb-3">{req.description}</p>
                  )}
                  {role === "maintenance_staff" && (
                    <div className="mb-3 space-y-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Work note</label>
                        <Input
                          className="mt-1"
                          defaultValue={req.work_note ?? ""}
                          placeholder="Add progress update..."
                          onBlur={(e) => saveWorkNote(req.id, e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(req.status === "open" || req.status === "assigned") &&
                      (role !== "maintenance_staff" || req.assigned_to === user?.id) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(req.id, "in_progress")}
                      >
                        Start Repair
                      </Button>
                    )}
                    {req.status === "in_progress" &&
                      (role !== "maintenance_staff" || req.assigned_to === user?.id) && (
                      <Button size="sm" onClick={() => updateStatus(req.id, "resolved")}>
                        Mark Resolved
                      </Button>
                    )}
                    {req.status === "resolved" && hasPermission("maintenance", "assign") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(req.id, "closed")}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Maintenance Issue</DialogTitle>
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
                  value={form.room_id}
                  onChange={(v) => setForm({ ...form, room_id: v })}
                  placeholder="Select room"
                  searchPlaceholder="Search room number..."
                  emptyText="No room found"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                className="mt-1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Issue type</label>
              <div className="mt-1">
                <SearchableSelect
                  options={[
                    { label: "Electrical", value: "electrical" },
                    { label: "Plumbing", value: "plumbing" },
                    { label: "AC", value: "ac" },
                    { label: "Furniture", value: "furniture" },
                    { label: "Other", value: "other" },
                  ]}
                  value={form.issue_type}
                  onChange={(v) => setForm({ ...form, issue_type: v })}
                  placeholder="Select issue type"
                  searchPlaceholder="Search issue type..."
                  emptyText="No issue type found"
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
                  value={form.priority}
                  onChange={(v) => setForm({ ...form, priority: v })}
                  placeholder="Select priority"
                  searchPlaceholder="Search priority..."
                  emptyText="No priority found"
                />
              </div>
            </div>
            {staff.length > 0 && (
              <div>
                <label className="text-sm font-medium">Assign to (optional)</label>
                <div className="mt-1">
                  <SearchableSelect
                    options={[
                      { label: "Unassigned", value: "" },
                      ...staff.map((s) => ({ label: s.full_name, value: s.id })),
                    ]}
                    value={form.assigned_to}
                    onChange={(v) => setForm({ ...form, assigned_to: v })}
                    placeholder="Unassigned"
                    searchPlaceholder="Search staff..."
                    emptyText="No staff found"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                className="mt-1"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={reportIssue}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
