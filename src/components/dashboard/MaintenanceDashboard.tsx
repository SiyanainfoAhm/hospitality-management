"use client";

import { KpiGrid, QuickLinks, TaskList } from "./DashboardShell";

interface MaintJob {
  id: string;
  room: string;
  title: string;
  status: string;
  priority: string;
  issue_type?: string;
}

interface MaintenanceData {
  kpi: {
    open: number;
    inProgress: number;
    resolved: number;
    urgent: number;
    resolvedToday: number;
  };
  myJobs: MaintJob[];
}

export function MaintenanceDashboard({ data }: { data: MaintenanceData }) {
  const { kpi, myJobs } = data;

  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          {
            label: "Active Repairs",
            value: String(kpi.open),
            accent: "border-l-blue-500",
          },
          {
            label: "In Progress",
            value: String(kpi.inProgress),
            accent: "border-l-amber-500",
          },
          {
            label: "Urgent / High",
            value: String(kpi.urgent),
            accent: "border-l-red-500",
          },
          {
            label: "Resolved Today",
            value: String(kpi.resolvedToday),
            accent: "border-l-green-500",
          },
        ]}
      />

      <QuickLinks
        links={[
          { label: "My Repair Jobs", href: "/maintenance" },
          { label: "View Rooms", href: "/rooms" },
        ]}
      />

      <TaskList
        title="Active repair jobs"
        empty="No active repairs assigned to you"
        footerHref="/maintenance"
        footerLabel="Go to Maintenance"
        items={myJobs.map((j) => ({
          id: j.id,
          primary: `Room ${j.room} — ${j.title}`,
          secondary: j.issue_type?.replace(/_/g, " "),
          badge: j.status,
          priority: j.priority,
          href: "/maintenance",
        }))}
      />
    </div>
  );
}
