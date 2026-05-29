import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requirePermission, setDbRequestContext } from "@/lib/auth/permissions-server";
import { canAccess, normalizeRole } from "@/config/rbac";

export async function GET() {
  const sessionOrDeny = await requirePermission("housekeeping", "view");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const session = sessionOrDeny;
  const role = normalizeRole(session.role);
  await setDbRequestContext(session.sub, session.role);

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("hotel_management_housekeeping_tasks")
    .select(`
      id,
      status,
      priority,
      notes,
      task_type,
      due_date,
      assigned_to,
      started_at,
      completed_at,
      created_at,
      hotel_management_rooms!room_id (
        id, room_number, floor
      ),
      hotel_management_users!assigned_to (
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (role === "housekeeping") {
    query = query.eq("assigned_to", session.sub);
  }

  const { data: tasks, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (tasks || [])
    .filter((t: Record<string, unknown>) => t.status !== "under_repair")
    .map((t: Record<string, unknown>) => {
    const room = t.hotel_management_rooms as { room_number?: string; floor?: number; id?: string } | null;
    const assignedUser = t.hotel_management_users as { full_name?: string } | null;
    let assigneeName: string | null = assignedUser?.full_name ?? null;
    let displayNotes = (t.notes as string) ?? "";
    if (!assigneeName && displayNotes.startsWith("Assigned to: ")) {
      assigneeName = displayNotes.replace("Assigned to: ", "");
      displayNotes = "";
    }

    return {
      id: t.id,
      room_id: room?.id,
      room: room?.room_number ?? "?",
      floor: room?.floor ?? 0,
      status: t.status,
      priority: t.priority,
      task_type: t.task_type ?? "cleaning",
      assignee: assigneeName,
      assigned_to: t.assigned_to,
      notes: displayNotes,
      due_date: t.due_date,
      time: t.started_at
        ? new Date(t.started_at as string).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    };
  });

  const { data: maintenanceRows } = await supabase
    .from("hotel_management_maintenance_requests")
    .select(`
      id,
      title,
      description,
      status,
      priority,
      issue_type,
      hotel_management_rooms!room_id ( room_number ),
      assignee:hotel_management_users!assigned_to ( full_name )
    `)
    .in("status", ["open", "assigned", "in_progress"])
    .order("created_at", { ascending: false });

  const underRepair = (maintenanceRows ?? []).map((r: Record<string, unknown>) => {
    const room = r.hotel_management_rooms as { room_number?: string } | null;
    const assignee = r.assignee as { full_name?: string } | null;
    return {
      id: r.id,
      room: room?.room_number ?? "?",
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      issue_type: r.issue_type,
      assignee: assignee?.full_name ?? null,
    };
  });

  return NextResponse.json({ tasks: formatted, underRepair });
}

export async function POST(request: NextRequest) {
  const sessionOrDeny = await requirePermission("housekeeping", "view");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const session = sessionOrDeny;
  if (!canAccess(session.role, "housekeeping", "assign")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await setDbRequestContext(session.sub, session.role);
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { room_id, assigned_to, task_type, priority, notes, due_date } = body;

  if (!room_id || !assigned_to) {
    return NextResponse.json(
      { error: "room_id and assigned_to are required" },
      { status: 400 }
    );
  }

  const insertData: Record<string, unknown> = {
    room_id,
    assigned_to,
    status: "assigned",
    priority: priority ?? "normal",
    notes: notes || null,
    task_type: task_type ?? "cleaning",
    due_date: due_date || null,
    created_by: session.sub,
  };

  const { data: task, error } = await supabase
    .from("hotel_management_housekeeping_tasks")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("hotel_management_rooms")
    .update({ status: "dirty" })
    .eq("id", room_id);

  return NextResponse.json({ success: true, id: task.id });
}

export async function PATCH(request: NextRequest) {
  const sessionOrDeny = await requirePermission("housekeeping", "update");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const session = sessionOrDeny;
  const role = normalizeRole(session.role);
  await setDbRequestContext(session.sub, session.role);

  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const { id, status, assigned_to } = body;

  if (!id) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("hotel_management_housekeeping_tasks")
    .select("id, room_id, assigned_to, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (role === "housekeeping" && existing.assigned_to !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;

  if (assigned_to !== undefined && canAccess(session.role, "housekeeping", "assign")) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(assigned_to)) {
      updateData.assigned_to = assigned_to;
    }
  }

  if (status === "cleaning") {
    updateData.started_at = new Date().toISOString();
  }
  if (status === "clean" || status === "inspected") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("hotel_management_housekeeping_tasks")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (status === "clean" && existing.room_id) {
    await supabase
      .from("hotel_management_rooms")
      .update({ status: "clean" })
      .eq("id", existing.room_id);
  }
  if (status === "inspected" && existing.room_id) {
    await supabase
      .from("hotel_management_rooms")
      .update({ status: "available" })
      .eq("id", existing.room_id);
  }

  return NextResponse.json({ success: true });
}
