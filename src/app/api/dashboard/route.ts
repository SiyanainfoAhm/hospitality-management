import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requirePermission, setDbRequestContext } from "@/lib/auth/permissions-server";
import { normalizeRole } from "@/config/rbac";

export async function GET() {
  const sessionOrDeny = await requirePermission("dashboard", "view");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const session = sessionOrDeny;
  const role = normalizeRole(session.role);
  if (!role) {
    return NextResponse.json({ error: "Invalid role" }, { status: 403 });
  }

  await setDbRequestContext(session.sub, session.role);
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];
  const userId = session.sub;

  const [roomsRes, reservationsRes] = await Promise.all([
    supabase
      .from("hotel_management_rooms")
      .select("id, room_number, floor, status")
      .eq("is_active", true)
      .order("room_number"),
    supabase
      .from("hotel_management_reservations")
      .select(
        "id, status, check_in_date, check_out_date, total_amount, booking_code, hotel_management_guests!guest_id(full_name), hotel_management_rooms!room_id(room_number)"
      ),
  ]);

  const rooms = roomsRes.data ?? [];
  const reservations = reservationsRes.data ?? [];

  const statusCounts: Record<string, number> = {};
  rooms.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const baseKpi = {
    totalRooms: rooms.length,
    occupied: statusCounts["checked_in"] || 0,
    available: statusCounts["available"] || 0,
    reserved: statusCounts["reserved"] || 0,
    dirty: statusCounts["dirty"] || 0,
    todayCheckins: reservations.filter(
      (r) => r.check_in_date === today && r.status === "confirmed"
    ).length,
    todayCheckouts: reservations.filter(
      (r) => r.check_out_date === today && r.status === "checked_in"
    ).length,
    revenueToday: 0,
  };

  if (role === "admin" || role === "accounts") {
    const { data: payments } = await supabase
      .from("hotel_management_payments")
      .select("amount")
      .gte("paid_at", `${today}T00:00:00`)
      .lte("paid_at", `${today}T23:59:59`);
    baseKpi.revenueToday = (payments ?? []).reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
  }

  const roomGrid = rooms.map((r) => ({
    number: r.room_number,
    status: r.status,
    floor: r.floor,
  }));

  // Role-specific payloads
  if (role === "housekeeping") {
    let hkQuery = supabase
      .from("hotel_management_housekeeping_tasks")
      .select(
        `
        id, status, priority, notes, task_type, due_date, assigned_to, started_at, completed_at,
        hotel_management_rooms!room_id(room_number, floor)
      `
      )
      .order("created_at", { ascending: false });

    if (role === "housekeeping") {
      hkQuery = hkQuery.eq("assigned_to", userId);
    }

    const { data: myTasks } = await hkQuery;

    const tasks = (myTasks ?? []).map((t: Record<string, unknown>) => {
      const room = t.hotel_management_rooms as { room_number?: string; floor?: number } | null;
      return {
        id: t.id,
        room: room?.room_number ?? "?",
        floor: room?.floor ?? 0,
        status: t.status,
        priority: t.priority,
        task_type: t.task_type ?? "cleaning",
        notes: t.notes,
        due_date: t.due_date,
      };
    });

    return NextResponse.json({
      role,
      kpi: {
        assignedToday: tasks.length,
        dirty: tasks.filter((t) => t.status === "dirty" || t.status === "assigned").length,
        inProgress: tasks.filter((t) => t.status === "cleaning").length,
        completed: tasks.filter((t) => t.status === "clean" || t.status === "inspected").length,
      },
      myTasks: tasks,
      rooms: roomGrid.filter((r) =>
        ["dirty", "cleaning", "clean", "assigned"].includes(r.status)
      ),
    });
  }

  if (role === "maintenance_staff") {
    const { data: myJobs } = await supabase
      .from("hotel_management_maintenance_requests")
      .select(
        `
        id, title, description, status, priority, issue_type, room_id, assigned_to,
        reported_at, started_at, resolved_at,
        hotel_management_rooms!room_id(room_number)
      `
      )
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false });

    const jobs = (myJobs ?? []).map((j: Record<string, unknown>) => {
      const room = j.hotel_management_rooms as { room_number?: string } | null;
      return {
        id: j.id,
        room: room?.room_number ?? "?",
        title: j.title,
        description: j.description,
        status: j.status,
        priority: j.priority,
        issue_type: j.issue_type ?? "other",
        resolved_at: j.resolved_at,
      };
    });

    const activeStatuses = ["open", "assigned", "in_progress"];
    const activeJobs = jobs.filter((j) => activeStatuses.includes(j.status as string));

    const resolvedToday = jobs.filter((j) => {
      if (!j.resolved_at) return false;
      const d = new Date(j.resolved_at as string).toISOString().slice(0, 10);
      return d === today;
    }).length;

    return NextResponse.json({
      role,
      kpi: {
        open: activeJobs.length,
        inProgress: jobs.filter((j) => j.status === "in_progress").length,
        resolved: jobs.filter((j) => j.status === "resolved" || j.status === "closed").length,
        urgent: activeJobs.filter(
          (j) => j.priority === "urgent" || j.priority === "high"
        ).length,
        resolvedToday,
      },
      myJobs: activeJobs,
    });
  }

  if (role === "front_desk") {
    const arrivals = reservations
      .filter((r) => r.check_in_date === today)
      .slice(0, 10)
      .map((r: Record<string, unknown>) => {
        const guest = r.hotel_management_guests as { full_name?: string } | null;
        const room = r.hotel_management_rooms as { room_number?: string } | null;
        return {
          booking_code: r.booking_code,
          guest: guest?.full_name ?? "Guest",
          room: room?.room_number ?? "—",
          status: r.status,
        };
      });

    return NextResponse.json({
      role,
      kpi: baseKpi,
      rooms: roomGrid,
      arrivals,
      departures: reservations
        .filter((r) => r.check_out_date === today && r.status === "checked_in")
        .slice(0, 10),
    });
  }

  if (role === "fnb_manager") {
    const { data: orders } = await supabase
      .from("hotel_management_fnb_orders")
      .select("id, order_code, status, total_amount, created_at")
      .gte("created_at", `${today}T00:00:00`)
      .order("created_at", { ascending: false })
      .limit(20);

    const fnbRevenue = (orders ?? []).reduce(
      (s, o) => s + Number(o.total_amount),
      0
    );

    return NextResponse.json({
      role,
      kpi: {
        ordersToday: orders?.length ?? 0,
        pending: orders?.filter((o) => o.status === "pending").length ?? 0,
        fnbRevenueToday: fnbRevenue,
      },
      recentOrders: orders ?? [],
    });
  }

  if (role === "accounts") {
    const { data: invoices } = await supabase
      .from("hotel_management_invoices")
      .select("id, invoice_number, total_amount, paid_amount, balance_amount, status");

    const pending = (invoices ?? []).filter(
      (i) => i.status === "issued" || i.status === "partially_paid"
    );
    const paidToday = baseKpi.revenueToday;

    return NextResponse.json({
      role,
      kpi: {
        pendingInvoices: pending.length,
        outstanding: pending.reduce((s, i) => s + Number(i.balance_amount), 0),
        paidToday,
        totalInvoices: invoices?.length ?? 0,
      },
      pendingInvoices: pending.slice(0, 8),
    });
  }

  // Admin — full overview
  const [hkRes, maintRes] = await Promise.all([
    supabase.from("hotel_management_housekeeping_tasks").select("id, status"),
    supabase.from("hotel_management_maintenance_requests").select("id, status"),
  ]);

  const hkSummary: Record<string, number> = {};
  (hkRes.data ?? []).forEach((t) => {
    hkSummary[t.status] = (hkSummary[t.status] || 0) + 1;
  });

  const maintOpen =
    maintRes.data?.filter((m) => m.status === "open" || m.status === "in_progress")
      .length ?? 0;

  return NextResponse.json({
    role,
    kpi: baseKpi,
    rooms: roomGrid,
    housekeeping: hkSummary,
    maintenancePending: maintOpen,
  });
}
