"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiGrid, QuickLinks } from "./DashboardShell";
import { cn, formatCurrency, roomStatusColors, roomStatusLabels } from "@/lib/utils";

interface AdminData {
  kpi: {
    totalRooms: number;
    occupied: number;
    available: number;
    reserved: number;
    dirty: number;
    todayCheckins: number;
    todayCheckouts: number;
    revenueToday: number;
  };
  rooms: { number: string; status: string; floor: number }[];
  housekeeping: Record<string, number>;
  maintenancePending: number;
}

export function AdminDashboard({ data }: { data: AdminData }) {
  const { kpi, rooms, housekeeping, maintenancePending } = data;

  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Total Rooms", value: String(kpi.totalRooms), color: "" },
          { label: "Occupied", value: String(kpi.occupied), color: "" },
          { label: "Available", value: String(kpi.available), color: "" },
          { label: "Revenue Today", value: formatCurrency(kpi.revenueToday), color: "" },
          { label: "Check-ins", value: String(kpi.todayCheckins), color: "" },
          { label: "Check-outs", value: String(kpi.todayCheckouts), color: "" },
          { label: "Dirty", value: String(kpi.dirty), color: "" },
          { label: "Maint. Open", value: String(maintenancePending), color: "" },
        ]}
      />

      <QuickLinks
        links={[
          { label: "Reservations", href: "/reservations" },
          { label: "Check-in / Out", href: "/checkin" },
          { label: "Housekeeping", href: "/housekeeping" },
          { label: "Maintenance", href: "/maintenance" },
          { label: "Billing", href: "/billing" },
          { label: "Reports", href: "/reports" },
          { label: "Settings", href: "/settings" },
        ]}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Room Status Grid ({rooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-14 gap-1.5">
            {rooms.map((room) => (
              <div
                key={room.number}
                className={cn(
                  "flex h-9 items-center justify-center rounded-md border text-[10px] font-medium",
                  roomStatusColors[room.status]
                )}
                title={roomStatusLabels[room.status]}
              >
                {room.number}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Housekeeping Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          {Object.entries(housekeeping).map(([status, count]) => (
            <span key={status} className="capitalize">
              {status.replace("_", " ")}: <strong>{count}</strong>
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
