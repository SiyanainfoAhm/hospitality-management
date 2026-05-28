"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KpiGrid, QuickLinks } from "./DashboardShell";
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
          { label: "Orders Today", value: String(kpi.ordersToday), color: "" },
          { label: "Pending", value: String(kpi.pending), color: "" },
          { label: "F&B Revenue Today", value: formatCurrency(kpi.fnbRevenueToday), color: "" },
        ]}
      />

      <QuickLinks
        links={[
          { label: "New POS Order", href: "/fnb" },
          { label: "Room Service", href: "/fnb?mode=room-service" },
        ]}
      />

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-semibold text-base mb-3">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No orders today</p>
        ) : (
          <ul className="space-y-2">
            {recentOrders.map((o) => (
              <li
                key={o.id}
                className="flex justify-between text-sm border-b py-2 last:border-0"
              >
                <span>{o.order_code}</span>
                <span className="capitalize text-gray-500">{o.status}</span>
                <span className="font-medium">{formatCurrency(o.total_amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-center">
        <Link href="/fnb">
          <Button>Open F&B POS</Button>
        </Link>
      </div>
    </div>
  );
}
