"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BedDouble,
  Users,
  CalendarCheck,
  CalendarX,
  Sparkles,
  LogIn,
  LogOut,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency, roomStatusColors, roomStatusLabels } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  kpi: {
    totalRooms: number;
    occupied: number;
    available: number;
    reserved: number;
    dirty: number;
    todayCheckins: number;
    todayCheckouts: number;
    revenueToday: number;
  };
  rooms: { number: string; status: string; floor: number }[];
  housekeeping: Record<string, number>;
}

// Static chart data (would come from a reporting API in production)
const occupancyData = [
  { day: "Mon", occupancy: 72 },
  { day: "Tue", occupancy: 68 },
  { day: "Wed", occupancy: 75 },
  { day: "Thu", occupancy: 80 },
  { day: "Fri", occupancy: 85 },
  { day: "Sat", occupancy: 90 },
  { day: "Sun", occupancy: 78 },
];

const revenueData = [
  { month: "Jan", revenue: 185000 },
  { month: "Feb", revenue: 210000 },
  { month: "Mar", revenue: 195000 },
  { month: "Apr", revenue: 230000 },
  { month: "May", revenue: 250000 },
];

const pendingPayments = [
  { guest: "Dr. Rajesh Kumar", room: "301", amount: 12500, days: 3 },
  { guest: "Prof. Meera Sharma", room: "205", amount: 8700, days: 1 },
  { guest: "Mr. Ankit Patel", room: "412", amount: 15200, days: 5 },
  { guest: "Ms. Priya Singh", room: "108", amount: 6300, days: 2 },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpi = data?.kpi;
  const roomGrid = data?.rooms ?? [];
  const hk = data?.housekeeping ?? {};

  const kpiCards = [
    { label: "Total Rooms", value: kpi ? String(kpi.totalRooms) : "—", icon: BedDouble, color: "bg-blue-50 text-blue-600" },
    { label: "Occupied", value: kpi ? String(kpi.occupied) : "—", icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Available", value: kpi ? String(kpi.available) : "—", icon: CalendarCheck, color: "bg-emerald-50 text-emerald-600" },
    { label: "Reserved", value: kpi ? String(kpi.reserved) : "—", icon: CalendarX, color: "bg-amber-50 text-amber-600" },
    { label: "Dirty Rooms", value: kpi ? String(kpi.dirty) : "—", icon: Sparkles, color: "bg-red-50 text-red-600" },
    { label: "Today Check-ins", value: kpi ? String(kpi.todayCheckins) : "—", icon: LogIn, color: "bg-teal-50 text-teal-600" },
    { label: "Today Check-outs", value: kpi ? String(kpi.todayCheckouts) : "—", icon: LogOut, color: "bg-orange-50 text-orange-600" },
    { label: "Revenue Today", value: kpi ? formatCurrency(kpi.revenueToday) : "—", icon: IndianRupee, color: "bg-green-50 text-green-600" },
  ];

  const housekeepingPieData = [
    { name: "Clean", value: hk["clean"] || 0, color: "#10b981" },
    { name: "Dirty", value: hk["dirty"] || 0, color: "#ef4444" },
    { name: "Assigned", value: hk["assigned"] || 0, color: "#f59e0b" },
    { name: "Inspected", value: hk["inspected"] || 0, color: "#3b82f6" },
    { name: "Under Repair", value: hk["under_repair"] || 0, color: "#8b5cf6" },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time overview of guest house operations</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-gray-500">Live</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((kpiItem) => (
            <Card key={kpiItem.label} className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 h-full">
                <div className="flex items-center justify-between h-full">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{kpiItem.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpiItem.value}</p>
                  </div>
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", kpiItem.color)}>
                    <kpiItem.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Room Status Grid */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Room Status Grid ({roomGrid.length} Rooms)</CardTitle>
              <div className="flex flex-wrap gap-2">
                {Object.entries(roomStatusLabels).map(([status, label]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={cn("h-3 w-3 rounded-sm border", roomStatusColors[status])} />
                    <span className="text-[10px] text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-20 xl:grid-cols-20 gap-1.5">
              {roomGrid.map((room) => (
                <div
                  key={room.number}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md border text-[10px] font-medium cursor-pointer hover:scale-105 transition-transform",
                    roomStatusColors[room.status]
                  )}
                  title={`Room ${room.number} - ${roomStatusLabels[room.status]}`}
                >
                  {room.number}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Occupancy Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Weekly Occupancy %</CardTitle>
                <Badge variant="success">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5.2%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="occupancy" fill="#1E2A44" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Monthly Revenue</CardTitle>
                <Badge variant="success">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.8%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#D4A017" strokeWidth={3} dot={{ fill: "#D4A017" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Housekeeping Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Housekeeping Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={housekeepingPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {housekeepingPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {housekeepingPieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pending Payments</CardTitle>
                <Badge variant="warning">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  4 pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingPayments.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.guest}</p>
                      <p className="text-xs text-gray-500">Room {item.room} &bull; {item.days} day{item.days > 1 ? "s" : ""} overdue</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
