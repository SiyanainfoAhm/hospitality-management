"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Loader2 } from "lucide-react";

/** User management lives in Settings; this route enforces user_management permission */
export default function UsersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?tab=users");
  }, [router]);

  return (
    <AppLayout module="user_management">
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    </AppLayout>
  );
}
