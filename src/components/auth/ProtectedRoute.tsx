"use client";

import { useAuth } from "@/lib/auth/useAuth";
import { canAccess, type Module, type PermissionAction } from "@/config/rbac";
import { AccessDenied } from "./AccessDenied";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  module: Module;
  action?: PermissionAction;
  children: React.ReactNode;
}

export function ProtectedRoute({
  module,
  action = "view",
  children,
}: ProtectedRouteProps) {
  const { loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the user is not signed in (or session just cleared on logout),
    // redirect to login instead of showing an "access denied" state.
    if (!loading && !role) {
      router.replace("/login");
    }
  }, [loading, role, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!canAccess(role, module, action)) {
    return <AccessDenied role={role} />;
  }

  return <>{children}</>;
}
