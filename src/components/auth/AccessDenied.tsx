"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, normalizeRole } from "@/config/rbac";

export function AccessDenied({ role }: { role: string | null }) {
  const normalized = role ? normalizeRole(role) : null;
  const roleLabel = normalized ? ROLE_LABELS[normalized] : "";
  const isSignedOut = !role;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <ShieldX className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Access Restricted</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        {isSignedOut
          ? "You are not signed in. Please log in again."
          : "You do not have permission to access this module."}
      </p>
      {roleLabel && (
        <p className="mt-3 text-xs text-gray-500">
          Signed in as <span className="font-medium text-gray-700">{roleLabel}</span>
        </p>
      )}
      <Link href={isSignedOut ? "/login" : "/dashboard"} className="mt-8">
        <Button>{isSignedOut ? "Go to Login" : "Back to Dashboard"}</Button>
      </Link>
    </div>
  );
}
