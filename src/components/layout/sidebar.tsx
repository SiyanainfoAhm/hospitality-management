"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/useAuth";
import { getVisibleNavItems } from "@/config/rbac";
import { Building2 } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { role, loading } = useAuth();

  const visibleItems = loading ? [] : getVisibleNavItems(role);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-[#1E2A44] text-white flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4A017]">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">Smart Hospitality</h1>
          <p className="text-[10px] text-gray-400 leading-tight">Management System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 px-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : (
          visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5 shrink-0", isActive && "text-[#D4A017]")}
                />
                {item.label}
              </Link>
            );
          })
        )}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] text-gray-400">IIM Nagpur Guest House</p>
          <p className="text-xs text-gray-300">82 Rooms &bull; Cloud-based</p>
        </div>
      </div>
    </aside>
  );
}
