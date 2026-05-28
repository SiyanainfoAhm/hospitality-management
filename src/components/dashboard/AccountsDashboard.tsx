"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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
          { label: "Pending Invoices", value: String(kpi.pendingInvoices), color: "" },
          { label: "Outstanding", value: formatCurrency(kpi.outstanding), color: "" },
          { label: "Paid Today", value: formatCurrency(kpi.paidToday), color: "" },
          { label: "Total Invoices", value: String(kpi.totalInvoices), color: "" },
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
        items={pendingInvoices.map((inv) => ({
          id: inv.id,
          primary: inv.invoice_number,
          secondary: formatCurrency(inv.balance_amount),
          badge: inv.status,
        }))}
      />

      <div className="flex justify-center">
        <Link href="/billing">
          <Button>Open Billing</Button>
        </Link>
      </div>
    </div>
  );
}
