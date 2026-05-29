"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export function statusBadgeClass(status: string): string {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    open: "bg-slate-100 text-slate-700",
    assigned: "bg-blue-100 text-blue-800",
    in_progress: "bg-amber-100 text-amber-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-emerald-100 text-emerald-800",
    dirty: "bg-red-100 text-red-800",
    cleaning: "bg-sky-100 text-sky-800",
    clean: "bg-green-100 text-green-800",
    inspected: "bg-emerald-100 text-emerald-800",
    confirmed: "bg-blue-100 text-blue-800",
    checked_in: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    urgent: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    normal: "bg-blue-50 text-blue-700",
    low: "bg-gray-100 text-gray-600",
  };
  return map[key] ?? "bg-gray-100 text-gray-700";
}

export function priorityBadgeClass(priority: string): string {
  return statusBadgeClass(priority);
}

export function KpiGrid({
  items,
}: {
  items: { label: string; value: string; accent?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((kpi) => (
        <Card
          key={kpi.label}
          className={cn(
            "h-full border-gray-100 shadow-sm overflow-hidden",
            kpi.accent && `border-l-4 ${kpi.accent}`
          )}
        >
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{kpi.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function QuickLinks({
  links,
}: {
  links: { label: string; href: string }[];
}) {
  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Button key={l.href} asChild variant="outline" size="sm" className="rounded-lg">
            <Link href={l.href}>{l.label}</Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

export type TaskListItem = {
  id: string;
  primary: string;
  secondary?: string;
  badge?: string;
  priority?: string;
  href?: string;
};

export function TaskList({
  title,
  items,
  empty,
  footerHref,
  footerLabel,
}: {
  title: string;
  items: TaskListItem[];
  empty: string;
  footerHref?: string;
  footerLabel?: string;
}) {
  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {items.length > 0 && (
          <span className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const content = (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900">{item.primary}</p>
                      {item.priority && (item.priority === "urgent" || item.priority === "high") && (
                        <span
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize",
                            priorityBadgeClass(item.priority)
                          )}
                        >
                          {item.priority}
                        </span>
                      )}
                    </div>
                    {item.secondary && (
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.secondary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[11px] font-medium capitalize px-2.5 py-1 rounded-full whitespace-nowrap",
                          statusBadgeClass(item.badge)
                        )}
                      >
                        {item.badge.replace(/_/g, " ")}
                      </span>
                    )}
                    {item.href && (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </>
              );

              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 hover:bg-gray-50 hover:border-gray-200 transition-colors"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {footerHref && footerLabel && (
          <div className="mt-4 flex justify-center">
            <Button asChild variant="default" className="rounded-lg">
              <Link href={footerHref}>{footerLabel}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { formatCurrency, cn };
