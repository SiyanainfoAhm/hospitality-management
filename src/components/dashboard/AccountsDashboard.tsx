"use client";

import { KpiGrid, QuickLinks, TaskList } from "./DashboardShell";
import { formatCurrency } from "@/lib/utils";

interface AccountsData {
  kpi: {
    pendingInvoices: number;
    outstanding: number;
    paidToday: number;
    totalInvoices: number;
  };
  pendingInvoices: {
    id: string;
    invoice_number: string;
    balance_amount: number;
    status: string;
  }[];
}

export function AccountsDashboard({ data }: { data: AccountsData }) {
  const { kpi, pendingInvoices } = data;

  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Pending Invoices", value: String(kpi.pendingInvoices), accent: "border-l-amber-500" },
          { label: "Outstanding", value: formatCurrency(kpi.outstanding), accent: "border-l-red-500" },
          { label: "Paid Today", value: formatCurrency(kpi.paidToday), accent: "border-l-green-500" },
          { label: "Total Invoices", value: String(kpi.totalInvoices), accent: "border-l-blue-500" },
        ]}
      />

      <QuickLinks
        links={[
          { label: "Record Payment", href: "/billing" },
          { label: "View Reports", href: "/reports" },
        ]}
      />

      <TaskList
        title="Pending Invoices"
        empty="No pending invoices"
        footerHref="/billing"
        footerLabel="Open Billing"
        items={pendingInvoices.map((inv) => ({
          id: inv.id,
          primary: inv.invoice_number,
          secondary: formatCurrency(inv.balance_amount),
          badge: inv.status,
          href: "/billing",
        }))}
      />
    </div>
  );
}
