"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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
          { label: "My Assigned Repairs", value: String(kpi.open), color: "" },
          { label: "In Progress", value: String(kpi.inProgress), color: "" },
          { label: "Urgent Issues", value: String(kpi.urgent), color: "" },
          { label: "Resolved Today", value: String(kpi.resolvedToday), color: "" },
        ]}
      />

      <QuickLinks
        links={[
          { label: "My Repair Jobs", href: "/maintenance" },
          { label: "View Rooms", href: "/rooms" },
        ]}
      />

      <TaskList
        title="Assigned repair list"
        empty="No repair jobs assigned to you"
        items={myJobs.map((j) => ({
          id: j.id,
          primary: `Room ${j.room} — ${j.title}`,
          secondary: j.issue_type,
          badge: j.status,
        }))}
      />

      <div className="flex justify-center">
        <Link href="/maintenance">
          <Button>Go to Maintenance</Button>
        </Link>
      </div>
    </div>
  );
}
