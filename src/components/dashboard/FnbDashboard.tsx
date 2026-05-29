"use client";

import { KpiGrid, QuickLinks, TaskList } from "./DashboardShell";
import { formatCurrency } from "@/lib/utils";

interface FnbData {
  kpi: {
    ordersToday: number;
    pending: number;
    fnbRevenueToday: number;
  };
  recentOrders: { id: string; order_code: string; status: string; total_amount: number }[];
}

export function FnbDashboard({ data }: { data: FnbData }) {
  const { kpi, recentOrders } = data;

  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Orders Today", value: String(kpi.ordersToday), accent: "border-l-blue-500" },
          { label: "Pending", value: String(kpi.pending), accent: "border-l-amber-500" },
          {
            label: "F&B Revenue Today",
            value: formatCurrency(kpi.fnbRevenueToday),
            accent: "border-l-green-500",
          },
        ]}
      />

      <QuickLinks
        links={[
          { label: "New POS Order", href: "/fnb" },
          { label: "Room Service", href: "/fnb?mode=room-service" },
        ]}
      />

      <TaskList
        title="Recent Orders"
        empty="No orders today"
        footerHref="/fnb"
        footerLabel="Open F&B POS"
        items={recentOrders.map((o) => ({
          id: o.id,
          primary: o.order_code,
          secondary: formatCurrency(o.total_amount),
          badge: o.status,
          href: "/fnb",
        }))}
      />
    </div>
  );
}
