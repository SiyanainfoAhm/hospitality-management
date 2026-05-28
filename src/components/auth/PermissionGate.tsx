"use client";

import { useAuth } from "@/lib/auth/useAuth";
import type { Module, PermissionAction } from "@/config/rbac";

interface PermissionGateProps {
  module: Module;
  action?: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  module,
  action = "view",
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, loading } = useAuth();

  if (loading) return null;
  if (!hasPermission(module, action)) return <>{fallback}</>;
  return <>{children}</>;
}
