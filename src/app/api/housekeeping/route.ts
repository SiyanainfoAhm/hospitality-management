import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: tasks, error } = await supabase
    .from("hotel_management_housekeeping_tasks")
    .select(`
      id,
      status,
      priority,
      notes,
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (tasks || []).map((t: any) => {
    const room = t.hotel_management_rooms as any;
    const assignedUser = t.hotel_management_users as any;

    // Determine assignee name: from user FK, or parse from notes
    let assigneeName: string | null = assignedUser?.full_name ?? null;
    let displayNotes = t.notes ?? "";
    if (!assigneeName && displayNotes.startsWith("Assigned to: ")) {
      assigneeName = displayNotes.replace("Assigned to: ", "");
      displayNotes = "";
    }

    return {
      id: t.id,
      room: room?.room_number ?? "?",
      floor: room?.floor ?? 0,
      status: t.status,
      priority: t.priority,
      assignee: assigneeName,
      notes: displayNotes,
      time: t.started_at
        ? new Date(t.started_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : t.created_at
        ? new Date(t.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "",
    };
  });

  return NextResponse.json({ tasks: formatted });
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const { id, status, assigned_to } = body;

  if (!id) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;

  // assigned_to is a UUID FK — only set if it's a valid UUID, otherwise store name in notes
  if (assigned_to !== undefined) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(assigned_to)) {
      updateData.assigned_to = assigned_to;
    } else {
      // Staff name passed — append to notes instead
      updateData.notes = `Assigned to: ${assigned_to}`;
    }
  }

  if (status === "assigned") {
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

  return NextResponse.json({ success: true });
}
