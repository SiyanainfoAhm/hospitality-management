"use client";

import { KpiGrid, QuickLinks, TaskList } from "./DashboardShell";

interface HkTask {
  id: string;
  room: string;
  floor: number;
  status: string;
  priority: string;
  task_type?: string;
  notes?: string | null;
}

interface HousekeepingData {
  kpi: {
    assignedToday: number;
    dirty: number;
    inProgress: number;
    completed: number;
  };
  myTasks: HkTask[];
}

export function HousekeepingDashboard({ data }: { data: HousekeepingData }) {
  const { kpi, myTasks } = data;
  const activeTasks = myTasks.filter((t) =>
    ["dirty", "assigned", "cleaning"].includes(t.status)
  );

  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          {
            label: "My Tasks Today",
            value: String(kpi.assignedToday),
            accent: "border-l-blue-500",
          },
          {
            label: "Pending / Dirty",
            value: String(kpi.dirty),
            accent: "border-l-red-500",
          },
          {
            label: "In Progress",
            value: String(kpi.inProgress),
            accent: "border-l-amber-500",
          },
          {
            label: "Completed",
            value: String(kpi.completed),
            accent: "border-l-green-500",
          },
        ]}
      />

      <QuickLinks
        links={[
          { label: "View All Tasks", href: "/housekeeping" },
          { label: "Dirty Rooms", href: "/rooms?status=dirty" },
          { label: "Report Maintenance", href: "/maintenance" },
        ]}
      />

      <TaskList
        title="My active tasks"
        empty="No active tasks assigned to you"
        footerHref="/housekeeping"
        footerLabel="Go to Housekeeping Board"
        items={activeTasks.map((t) => ({
          id: t.id,
          primary: `Room ${t.room} · Floor ${t.floor}`,
          secondary: [t.task_type?.replace(/_/g, " "), t.notes].filter(Boolean).join(" · ") || undefined,
          badge: t.status,
          priority: t.priority,
          href: "/housekeeping",
        }))}
      />
    </div>
  );
}
