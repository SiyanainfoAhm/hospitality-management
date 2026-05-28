"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth/useAuth";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { FrontDeskDashboard } from "@/components/dashboard/FrontDeskDashboard";
import { HousekeepingDashboard } from "@/components/dashboard/HousekeepingDashboard";
import { MaintenanceDashboard } from "@/components/dashboard/MaintenanceDashboard";
import { FnbDashboard } from "@/components/dashboard/FnbDashboard";
import { AccountsDashboard } from "@/components/dashboard/AccountsDashboard";
import { Loader2 } from "lucide-react";
import type { Role } from "@/config/rbac";

export default function DashboardPage() {
  const { role, loading: authLoading } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [authLoading, role]);

  const renderDashboard = (r: Role) => {
    if (!data) return null;
    switch (r) {
      case "admin":
        return <AdminDashboard data={data as never} />;
      case "front_desk":
        return <FrontDeskDashboard data={data as never} />;
      case "housekeeping":
        return <HousekeepingDashboard data={data as never} />;
      case "maintenance_staff":
        return <MaintenanceDashboard data={data as never} />;
      case "fnb_manager":
        return <FnbDashboard data={data as never} />;
      case "accounts":
        return <AccountsDashboard data={data as never} />;
      default:
        return <p className="text-gray-500">Unknown role dashboard.</p>;
    }
  };

  return (
    <AppLayout module="dashboard">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview for your role</p>
        </div>

        {authLoading || loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : role ? (
          renderDashboard(role)
        ) : (
          <p className="text-amber-600">Profile missing — cannot load dashboard.</p>
        )}
      </div>
    </AppLayout>
  );
}
