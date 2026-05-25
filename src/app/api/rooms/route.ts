import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: rooms, error } = await supabase
    .from("hotel_management_rooms")
    .select(`
      id,
      room_number,
      floor,
      status,
      is_active,
      notes,
      room_type_id,
      hotel_management_room_types (
        id,
        name,
        base_rate,
        max_occupancy
      )
    `)
    .eq("is_active", true)
    .order("room_number");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = rooms.map((room) => {
    const rt = room.hotel_management_room_types as unknown as { name: string; base_rate: number } | null;
    return {
      id: room.id,
      room_number: room.room_number,
      floor: room.floor,
      status: room.status,
      notes: room.notes,
      room_type_id: room.room_type_id,
      type: rt?.name ?? "Unknown",
      rate: rt?.base_rate ?? 0,
    };
  });

  // Also fetch room types for the add room form
  const { data: roomTypes } = await supabase
    .from("hotel_management_room_types")
    .select("id, name, base_rate")
    .order("name");

  return NextResponse.json({ rooms: formatted, roomTypes: roomTypes || [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { id, status, notes, room_type_id, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  if (room_type_id !== undefined) updateData.room_type_id = room_type_id;
  if (is_active !== undefined) updateData.is_active = is_active;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updatedRoom, error } = await supabase
    .from("hotel_management_rooms")
    .update(updateData)
    .eq("id", id)
    .select(`
      id,
      room_number,
      floor,
      status,
      notes,
      room_type_id,
      is_active,
      hotel_management_room_types (
        id,
        name,
        base_rate
      )
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rt = updatedRoom.hotel_management_room_types as unknown as { name: string; base_rate: number } | null;
  const formatted = {
    id: updatedRoom.id,
    room_number: updatedRoom.room_number,
    floor: updatedRoom.floor,
    status: updatedRoom.status,
    notes: updatedRoom.notes,
    room_type_id: updatedRoom.room_type_id,
    type: rt?.name ?? "Unknown",
    rate: rt?.base_rate ?? 0,
  };

  return NextResponse.json({ room: formatted });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { room_number, floor, room_type_id, status, notes } = body;

  if (!room_number || !floor || !room_type_id) {
    return NextResponse.json({ error: "Room number, floor, and room type are required" }, { status: 400 });
  }

  // Check for duplicate room number
  const { data: existing } = await supabase
    .from("hotel_management_rooms")
    .select("id")
    .eq("room_number", room_number)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: `Room ${room_number} already exists` }, { status: 409 });
  }

  const { data: newRoom, error } = await supabase
    .from("hotel_management_rooms")
    .insert({
      room_number,
      floor: Number(floor),
      room_type_id,
      status: status || "available",
      is_active: true,
      notes: notes || null,
    })
    .select(`
      id,
      room_number,
      floor,
      status,
      notes,
      room_type_id,
      hotel_management_room_types (
        id,
        name,
        base_rate
      )
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rtNew = newRoom.hotel_management_room_types as unknown as { name: string; base_rate: number } | null;
  const formatted = {
    id: newRoom.id,
    room_number: newRoom.room_number,
    floor: newRoom.floor,
    status: newRoom.status,
    notes: newRoom.notes,
    room_type_id: newRoom.room_type_id,
    type: rtNew?.name ?? "Unknown",
    rate: rtNew?.base_rate ?? 0,
  };

  return NextResponse.json({ room: formatted }, { status: 201 });
}
