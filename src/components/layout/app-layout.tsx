"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { PermissionAction, PermissionModule } from "@/lib/permissions";

interface AppLayoutProps {
  children: React.ReactNode;
  module: PermissionModule;
  action?: PermissionAction;
}

export function AppLayout({ children, module, action = "view" }: AppLayoutProps) {
  return (
    <ProtectedRoute module={module} action={action}>
      <div className="min-h-screen bg-[#F7F8FA]">
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
