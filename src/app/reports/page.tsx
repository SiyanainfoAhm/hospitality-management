"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  BedDouble,
  IndianRupee,
  Users,
  Sparkles,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { downloadCSV } from "@/lib/export";

interface DailyReport {
  date: string;
  totalRooms: number;
  occupied: number;
  available: number;
  outOfOrder: number;
  arrivals: number;
  departures: number;
  stayovers: number;
  noShows: number;
  cancellations: number;
  roomRevenue: number;
  fnbRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  avgRate: number;
  occupancyPercent: number;
  revpar: number;
}

interface HKSummary {
  total: number;
  completed: number;
  pending: number;
}

export default function ReportsPage() {
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [hkSummary, setHkSummary] = useState<HKSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.dailyReport) setDailyReport(data.dailyReport);
        if (data.housekeepingSummary) setHkSummary(data.housekeepingSummary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !dailyReport) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500">Operational analytics and performance metrics</p>
          </div>
          <Button variant="outline" onClick={() => {
            if (!dailyReport) return;
            const headers = ["Metric", "Value"];
            const rows = [
              ["Date", dailyReport.date],
              ["Total Rooms", String(dailyReport.totalRooms)],
              ["Occupied", String(dailyReport.occupied)],
              ["Available", String(dailyReport.available)],
              ["Out of Order", String(dailyReport.outOfOrder)],
              ["Arrivals", String(dailyReport.arrivals)],
              ["Departures", String(dailyReport.departures)],
              ["Stayovers", String(dailyReport.stayovers)],
              ["No Shows", String(dailyReport.noShows)],
              ["Cancellations", String(dailyReport.cancellations)],
              ["Occupancy %", `${dailyReport.occupancyPercent}%`],
              ["Room Revenue", String(dailyReport.roomRevenue)],
              ["F&B Revenue", String(dailyReport.fnbRevenue)],
              ["Tax Collected", String(dailyReport.otherRevenue)],
              ["Total Revenue", String(dailyReport.totalRevenue)],
              ["ADR", String(dailyReport.avgRate)],
              ["RevPAR", String(dailyReport.revpar)],
            ];
            if (hkSummary) {
              rows.push(["HK Total Tasks", String(hkSummary.total)]);
              rows.push(["HK Completed", String(hkSummary.completed)]);
              rows.push(["HK Pending", String(hkSummary.pending)]);
            }
            downloadCSV(`Daily_Report_${dailyReport.date}`, headers, rows);
          }}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily"><Calendar className="h-4 w-4 mr-2" /> Daily Report</TabsTrigger>
            <TabsTrigger value="housekeeping"><Sparkles className="h-4 w-4 mr-2" /> Housekeeping</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-4 space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{dailyReport.date}</span>
              <Badge variant="secondary">Today</Badge>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                      <BedDouble className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occupancy</p>
                      <p className="text-lg font-bold">{dailyReport.occupancyPercent}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Revenue</p>
                      <p className="text-lg font-bold">{formatCurrency(dailyReport.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ADR</p>
                      <p className="text-lg font-bold">{formatCurrency(dailyReport.avgRate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                      <Users className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">RevPAR</p>
                      <p className="text-lg font-bold">{formatCurrency(dailyReport.revpar)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Room Statistics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Room Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Total Rooms", value: dailyReport.totalRooms },
                      { label: "Occupied", value: dailyReport.occupied },
                      { label: "Available", value: dailyReport.available },
                      { label: "Out of Order", value: dailyReport.outOfOrder },
                      { label: "Arrivals Today", value: dailyReport.arrivals },
                      { label: "Departures Today", value: dailyReport.departures },
                      { label: "Stayovers", value: dailyReport.stayovers },
                      { label: "No Shows", value: dailyReport.noShows },
                      { label: "Cancellations", value: dailyReport.cancellations },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Room Revenue", value: dailyReport.roomRevenue, color: "bg-blue-500" },
                      { label: "F&B Revenue", value: dailyReport.fnbRevenue, color: "bg-green-500" },
                      { label: "Tax Collected", value: dailyReport.otherRevenue, color: "bg-purple-500" },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium">{formatCurrency(item.value)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${dailyReport.totalRevenue > 0 ? (item.value / dailyReport.totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t flex justify-between">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-sm font-bold">{formatCurrency(dailyReport.totalRevenue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="housekeeping" className="mt-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Housekeeping Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {hkSummary ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{hkSummary.total}</p>
                      <p className="text-xs text-gray-500">Total Tasks</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <p className="text-2xl font-bold text-green-700">{hkSummary.completed}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4 text-center">
                      <p className="text-2xl font-bold text-amber-700">{hkSummary.pending}</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No housekeeping data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
