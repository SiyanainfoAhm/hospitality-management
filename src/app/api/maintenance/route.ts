import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requirePermission, setDbRequestContext } from "@/lib/auth/permissions-server";
import { canAccess, normalizeRole } from "@/config/rbac";

const MAINT_TRANSITIONS: Record<string, string[]> = {
  assigned: ["in_progress"],
  in_progress: ["resolved"],
};

export async function GET() {
  const sessionOrDeny = await requirePermission("maintenance", "view");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const session = sessionOrDeny;
  const role = normalizeRole(session.role);
  await setDbRequestContext(session.sub, session.role);

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("hotel_management_maintenance_requests")
    .select(`
      id,
      title,
      description,
      status,
      priority,
      issue_type,
      assigned_to,
      reported_by,
      material_required,
      resolution_note,
      work_note,
      reported_at,
      started_at,
      resolved_at,
      created_at,
      hotel_management_rooms!room_id ( id, room_number ),
      reporter:hotel_management_users!reported_by ( full_name ),
      assignee:hotel_management_users!assigned_to ( full_name )
    `)
    .order("created_at", { ascending: false });

  if (role === "maintenance_staff") {
    query = query.eq("assigned_to", session.sub);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (data ?? []).map((r: Record<string, unknown>) => {
    const room = r.hotel_management_rooms as { room_number?: string; id?: string } | null;
    const reporter = r.reporter as { full_name?: string } | null;
    const assignee = r.assignee as { full_name?: string } | null;
    return {
      id: r.id,
      room_id: room?.id,
      room: room?.room_number ?? "?",
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      issue_type: r.issue_type ?? "other",
      assigned_to: r.assigned_to,
      assignee: assignee?.full_name,
      reported_by_name: reporter?.full_name,
      material_required: r.material_required,
      resolution_note: r.resolution_note,
      work_note: r.work_note,
    };
  });

  return NextResponse.json({ requests: formatted });
}

export async function POST(request: NextRequest) {
  const sessionOrDeny = await requirePermission("maintenance", "create");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const session = sessionOrDeny;
  const role = normalizeRole(session.role);
  if (role === "maintenance_staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await setDbRequestContext(session.sub, session.role);

  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const {
    room_id,
    title,
    description,
    issue_type,
    priority,
    assigned_to,
    material_required,
  } = body;

  if (!room_id || !title) {
    return NextResponse.json({ error: "room_id and title are required" }, { status: 400 });
  }

  const status = assigned_to ? "assigned" : "open";

  const { data, error } = await supabase
    .from("hotel_management_maintenance_requests")
    .insert({
      room_id,
      title,
      description: description ?? null,
      issue_type: issue_type ?? "other",
      priority: priority ?? "normal",
      status,
      reported_by: session.sub,
      assigned_to: assigned_to ?? null,
      material_required: material_required ?? null,
      reported_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reporting a maintenance issue moves the room into repair mode.
  // (Maintenance staff never updates room status directly.)
  await supabase.from("hotel_management_rooms").update({ status: "under_repair" }).eq("id", room_id);

  return NextResponse.json({ success: true, id: data.id });
}

export async function PATCH(request: NextRequest) {
  const sessionOrDeny = await requirePermission("maintenance", "update");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const session = sessionOrDeny;
  const role = normalizeRole(session.role);
  await setDbRequestContext(session.sub, session.role);

  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const { id, status, assigned_to, resolution_note, material_required, work_note } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("hotel_management_maintenance_requests")
    .select("id, room_id, assigned_to, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isMaintStaff = role === "maintenance_staff";
  if (isMaintStaff) {
    if (existing.assigned_to !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Maintenance Staff:
    // - status transitions: assigned -> in_progress -> resolved
    // - cannot close
    // - can update notes/material fields only
    if (status) {
      const current = String(existing.status ?? "");
      const allowed = MAINT_TRANSITIONS[current] ?? [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status transition" },
          { status: 400 }
        );
      }
    }
    if (assigned_to) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Enforce updates through controlled RPCs (defense-in-depth with service_role).
    if (status) {
      const { error: rpcErr } = await supabase.rpc("update_maintenance_status", {
        request_id: id,
        new_status: status,
        note: work_note ?? null,
        material: material_required ?? null,
        resolution: resolution_note ?? null,
      });
      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 400 });
      }
    } else {
      const { error: rpcErr } = await supabase.rpc("update_maintenance_note", {
        request_id: id,
        note: work_note ?? null,
        material: material_required ?? null,
        resolution: resolution_note ?? null,
      });
      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 400 });
      }
    }

    // Only handle room status workflow after a successful status change.
    if (existing.room_id && status === "resolved") {
      await supabase
        .from("hotel_management_rooms")
        .update({ status: "maintenance_resolved" })
        .eq("id", existing.room_id);
    }

    return NextResponse.json({ success: true });
  }

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (resolution_note !== undefined) updateData.resolution_note = resolution_note;
  if (material_required !== undefined) updateData.material_required = material_required;
  if (work_note !== undefined) updateData.work_note = work_note;

  if (assigned_to && canAccess(session.role, "maintenance", "assign")) {
    updateData.assigned_to = assigned_to;
    if (!status) updateData.status = "assigned";
  }

  if (status === "in_progress") {
    updateData.started_at = new Date().toISOString();
  }
  if (status === "resolved") {
    updateData.resolved_at = new Date().toISOString();
  }
  if (status === "closed") {
    updateData.resolved_at = updateData.resolved_at ?? new Date().toISOString();
  }

  const { error } = await supabase
    .from("hotel_management_maintenance_requests")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Room status workflow:
  // - issue reported -> under_repair (handled in POST)
  // - maintenance resolved -> maintenance_resolved (never sets available)
  // - final closure / availability is handled by Admin/Front Desk inspection flows
  if (existing.room_id && status === "resolved") {
    await supabase
      .from("hotel_management_rooms")
      .update({ status: "maintenance_resolved" })
      .eq("id", existing.room_id);
  }

  return NextResponse.json({ success: true });
}
