import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requirePermission, setDbRequestContext } from "@/lib/auth/permissions-server";

export async function GET() {
  const sessionOrDeny = await requirePermission("reports", "view");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;
  await setDbRequestContext(sessionOrDeny.sub, sessionOrDeny.role);

  const supabase = createServerSupabaseClient();

  // Room stats
  const { data: allRooms } = await supabase
    .from("hotel_management_rooms")
    .select("id, status, room_type_id")
    .eq("is_active", true);

  const totalRooms = allRooms?.length ?? 0;
  const occupied = allRooms?.filter((r) => r.status === "checked_in").length ?? 0;
  const available = allRooms?.filter((r) => r.status === "available" || r.status === "clean" || r.status === "inspected").length ?? 0;
  const outOfOrder = allRooms?.filter((r) => r.status === "under_repair" || r.status === "blocked").length ?? 0;

  // Today's reservations
  const today = new Date().toISOString().split("T")[0];

  const { data: todayArrivals } = await supabase
    .from("hotel_management_reservations")
    .select("id")
    .eq("check_in_date", today)
    .in("status", ["confirmed", "checked_in"]);

  const { data: todayDepartures } = await supabase
    .from("hotel_management_reservations")
    .select("id")
    .eq("check_out_date", today)
    .in("status", ["checked_in", "checked_out"]);

  const { data: stayovers } = await supabase
    .from("hotel_management_reservations")
    .select("id")
    .eq("status", "checked_in")
    .lt("check_in_date", today)
    .gt("check_out_date", today);

  const { data: noShows } = await supabase
    .from("hotel_management_reservations")
    .select("id")
    .eq("status", "no_show")
    .eq("check_in_date", today);

  const { data: cancellations } = await supabase
    .from("hotel_management_reservations")
    .select("id")
    .eq("status", "cancelled")
    .gte("created_at", `${today}T00:00:00`);

  // Revenue from payments
  const { data: payments } = await supabase
    .from("hotel_management_payments")
    .select("amount, paid_at");

  const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0;

  // Revenue from invoices
  const { data: invoices } = await supabase
    .from("hotel_management_invoices")
    .select("subtotal, tax_amount, total_amount, paid_amount, status");

  const roomRevenue = invoices?.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) ?? 0;
  const totalTax = invoices?.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0) ?? 0;

  // F&B revenue from orders
  const { data: fnbOrders } = await supabase
    .from("hotel_management_fnb_orders")
    .select("total_amount, status")
    .in("status", ["served", "completed"]);

  const fnbRevenue = fnbOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) ?? 0;

  const totalRevenue = roomRevenue + fnbRevenue;
  const occupancyPercent = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100 * 10) / 10 : 0;
  const adr = occupied > 0 ? Math.round(roomRevenue / occupied) : 0;
  const revpar = totalRooms > 0 ? Math.round(totalRevenue / totalRooms) : 0;

  // Housekeeping tasks summary
  const { data: hkTasks } = await supabase
    .from("hotel_management_housekeeping_tasks")
    .select("id, status, notes, started_at, completed_at");

  const hkCompleted = hkTasks?.filter((t) => t.status === "clean" || t.status === "inspected").length ?? 0;
  const hkPending = hkTasks?.filter((t) => t.status === "dirty" || t.status === "assigned" || t.status === "cleaning").length ?? 0;

  const dailyReport = {
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    totalRooms,
    occupied,
    available,
    outOfOrder,
    arrivals: todayArrivals?.length ?? 0,
    departures: todayDepartures?.length ?? 0,
    stayovers: stayovers?.length ?? 0,
    noShows: noShows?.length ?? 0,
    cancellations: cancellations?.length ?? 0,
    roomRevenue,
    fnbRevenue,
    otherRevenue: totalTax,
    totalRevenue: roomRevenue + fnbRevenue + totalTax,
    avgRate: adr,
    occupancyPercent,
    revpar,
  };

  const housekeepingSummary = {
    total: hkTasks?.length ?? 0,
    completed: hkCompleted,
    pending: hkPending,
  };

  return NextResponse.json({ dailyReport, housekeepingSummary });
}
