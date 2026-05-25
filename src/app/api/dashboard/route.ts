import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const today = new Date().toISOString().split("T")[0];

  const [roomsRes, reservationsRes, hkRes, revenueRes] = await Promise.all([
    supabase
      .from("hotel_management_rooms")
      .select("id, room_number, floor, status")
      .eq("is_active", true)
      .order("room_number"),

    supabase
      .from("hotel_management_reservations")
      .select("id, status, check_in_date, check_out_date, total_amount")
      .or(`check_in_date.eq.${today},check_out_date.eq.${today},and(status.eq.checked_in)`),

    supabase
      .from("hotel_management_housekeeping_tasks")
      .select("id, status, room_id"),

    supabase
      .from("hotel_management_payments")
      .select("amount, paid_at")
      .gte("paid_at", `${today}T00:00:00`)
      .lte("paid_at", `${today}T23:59:59`),
  ]);

  const rooms = roomsRes.data ?? [];
  const reservations = reservationsRes.data ?? [];
  const hkTasks = hkRes.data ?? [];
  const todayPayments = revenueRes.data ?? [];

  const totalRooms = rooms.length;
  const statusCounts: Record<string, number> = {};
  rooms.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const todayCheckins = reservations.filter((r) => r.check_in_date === today && r.status === "confirmed").length;
  const todayCheckouts = reservations.filter((r) => r.check_out_date === today && r.status === "checked_in").length;
  const revenueToday = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const hkSummary: Record<string, number> = {};
  hkTasks.forEach((t) => {
    hkSummary[t.status] = (hkSummary[t.status] || 0) + 1;
  });

  return NextResponse.json({
    kpi: {
      totalRooms,
      occupied: statusCounts["checked_in"] || 0,
      available: statusCounts["available"] || 0,
      reserved: statusCounts["reserved"] || 0,
      dirty: statusCounts["dirty"] || 0,
      todayCheckins,
      todayCheckouts,
      revenueToday,
    },
    rooms: rooms.map((r) => ({
      number: r.room_number,
      status: r.status,
      floor: r.floor,
    })),
    housekeeping: hkSummary,
  });
}
