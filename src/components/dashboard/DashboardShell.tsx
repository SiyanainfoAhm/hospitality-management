"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

export function KpiGrid({
  items,
}: {
  items: { label: string; value: string; color: string }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((kpi) => (
        <Card key={kpi.label} className="h-full">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Button key={l.href} asChild variant="outline" size="sm">
            <Link href={l.href}>{l.label}</Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

export function TaskList({
  title,
  items,
  empty,
}: {
  title: string;
  items: { id: string; primary: string; secondary?: string; badge?: string }[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{item.primary}</p>
                  {item.secondary && (
                    <p className="text-xs text-gray-500">{item.secondary}</p>
                  )}
                </div>
                {item.badge && (
                  <span className="text-xs capitalize text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { formatCurrency, cn };
