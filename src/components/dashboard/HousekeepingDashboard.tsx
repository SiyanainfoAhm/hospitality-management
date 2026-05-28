"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "My Tasks Today", value: String(kpi.assignedToday), color: "" },
          { label: "Pending / Dirty", value: String(kpi.dirty), color: "" },
          { label: "In Progress", value: String(kpi.inProgress), color: "" },
          { label: "Completed", value: String(kpi.completed), color: "" },
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
        title="My Assigned Rooms & Tasks"
        empty="No tasks assigned to you today"
        items={myTasks.map((t) => ({
          id: t.id,
          primary: `Room ${t.room} (Floor ${t.floor})`,
          secondary: [t.task_type, t.notes].filter(Boolean).join(" · ") || undefined,
          badge: t.status,
        }))}
      />

      <div className="flex justify-center">
        <Link href="/housekeeping">
          <Button>Go to Housekeeping Board</Button>
        </Link>
      </div>
    </div>
  );
}
