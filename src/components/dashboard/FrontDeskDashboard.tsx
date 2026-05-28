"use client";

import { KpiGrid, QuickLinks, TaskList } from "./DashboardShell";
import { cn, roomStatusColors } from "@/lib/utils";

interface FrontDeskData {
  kpi: {
    totalRooms: number;
    occupied: number;
    available: number;
    reserved: number;
    todayCheckins: number;
    todayCheckouts: number;
  };
  rooms: { number: string; status: string }[];
  arrivals: { booking_code: string; guest: string; room: string; status: string }[];
}

export function FrontDeskDashboard({ data }: { data: FrontDeskData }) {
  const { kpi, rooms, arrivals } = data;

  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Today Arrivals", value: String(kpi.todayCheckins), color: "" },
          { label: "Today Departures", value: String(kpi.todayCheckouts), color: "" },
          { label: "Available", value: String(kpi.available), color: "" },
          { label: "Reserved", value: String(kpi.reserved), color: "" },
        ]}
      />

      <QuickLinks
        links={[
          { label: "New Reservation", href: "/reservations" },
          { label: "Check-in Guest", href: "/checkin" },
          { label: "Check-out Guest", href: "/checkin?mode=checkout" },
        ]}
      />

      <TaskList
        title="Today's Arrivals"
        empty="No arrivals scheduled today"
        items={arrivals.map((a) => ({
          id: a.booking_code,
          primary: `${a.guest} — Room ${a.room}`,
          secondary: a.booking_code,
          badge: a.status,
        }))}
      />

      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-base font-semibold mb-3">Operational Room Grid</h3>
        <div className="grid grid-cols-10 md:grid-cols-14 gap-1">
          {rooms
            .filter((r) =>
              ["available", "reserved", "checked_in", "dirty", "clean"].includes(r.status)
            )
            .map((room) => (
              <div
                key={room.number}
                className={cn(
                  "h-8 flex items-center justify-center rounded text-[10px] border",
                  roomStatusColors[room.status]
                )}
              >
                {room.number}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
