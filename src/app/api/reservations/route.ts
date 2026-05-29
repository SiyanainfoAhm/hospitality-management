import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requirePermission, setDbRequestContext } from "@/lib/auth/permissions-server";
import { generateBookingCode } from "@/lib/utils";

const RATE_PLAN_PREFIX: Record<string, string> = {
  rack: "Rack Rate",
  corporate: "Corporate Rate",
  government: "Government Rate",
  long_stay: "Long Stay",
};

export async function GET(request: NextRequest) {
  const sessionOrDeny = await requirePermission("reservations", "view");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;
  await setDbRequestContext(sessionOrDeny.sub, sessionOrDeny.role);

  const supabase = createServerSupabaseClient();
  const { searchParams } = request.nextUrl;

  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("hotel_management_reservations")
    .select(`
      id,
      booking_code,
      check_in_date,
      check_out_date,
      adults,
      children,
      status,
      total_amount,
      deposit_amount,
      source,
      notes,
      created_at,
      hotel_management_guests!guest_id (
        id, full_name, mobile, email
      ),
      hotel_management_rooms!room_id (
        id, room_number,
        hotel_management_room_types ( name )
      ),
      hotel_management_rate_plans!rate_plan_id ( name )
    `);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: reservations, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let formatted = (reservations || []).map((r: any) => {
    const guest = r.hotel_management_guests as any;
    const room = r.hotel_management_rooms as any;
    const roomType = room?.hotel_management_room_types as any;
    const ratePlan = r.hotel_management_rate_plans as any;

    return {
      id: r.id,
      booking_code: r.booking_code,
      guest: guest?.full_name ?? "Unknown",
      mobile: guest?.mobile ?? "",
      email: guest?.email ?? "",
      room: room?.room_number ?? "",
      type: roomType?.name ?? "Unknown",
      rate_plan: ratePlan?.name ?? "",
      check_in: r.check_in_date,
      check_out: r.check_out_date,
      adults: r.adults,
      children: r.children,
      status: r.status,
      amount: r.total_amount,
      deposit: r.deposit_amount,
      source: r.source,
      notes: r.notes,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    formatted = formatted.filter((r) =>
      r.guest.toLowerCase().includes(q) ||
      r.booking_code.toLowerCase().includes(q) ||
      r.mobile.includes(q) ||
      r.room.includes(q)
    );
  }

  return NextResponse.json({ reservations: formatted });
}

export async function POST(request: NextRequest) {
  const sessionOrDeny = await requirePermission("reservations", "create");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;
  await setDbRequestContext(sessionOrDeny.sub, sessionOrDeny.role);

  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const {
    guest_name,
    mobile,
    email,
    id_proof_type,
    id_proof_number,
    room_id,
    check_in_date,
    check_out_date,
    adults = 1,
    children = 0,
    rate_plan = "rack",
    deposit_amount = 0,
    source = "direct",
    notes,
  } = body;

  if (!guest_name || !mobile || !room_id || !check_in_date || !check_out_date) {
    return NextResponse.json(
      { error: "Guest name, mobile, room, check-in and check-out are required" },
      { status: 400 }
    );
  }

  if (new Date(check_out_date) <= new Date(check_in_date)) {
    return NextResponse.json(
      { error: "Check-out must be after check-in" },
      { status: 400 }
    );
  }

  const { data: room, error: roomError } = await supabase
    .from("hotel_management_rooms")
    .select("id, room_number, room_type_id, status")
    .eq("id", room_id)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.status !== "available") {
    return NextResponse.json(
      { error: `Room ${room.room_number} is not available (${room.status})` },
      { status: 409 }
    );
  }

  const planPrefix = RATE_PLAN_PREFIX[rate_plan] ?? RATE_PLAN_PREFIX.rack;
  const { data: ratePlanRow } = await supabase
    .from("hotel_management_rate_plans")
    .select("id, rate")
    .eq("room_type_id", room.room_type_id)
    .ilike("name", `${planPrefix}%`)
    .limit(1)
    .maybeSingle();

  const { data: guest, error: guestError } = await supabase
    .from("hotel_management_guests")
    .insert({
      full_name: guest_name,
      mobile,
      email: email || null,
      id_proof_type: id_proof_type || null,
      id_proof_number: id_proof_number || null,
    })
    .select("id")
    .single();

  if (guestError || !guest) {
    return NextResponse.json({ error: guestError?.message ?? "Failed to create guest" }, { status: 500 });
  }

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(check_out_date).getTime() - new Date(check_in_date).getTime()) /
        86400000
    )
  );
  const nightlyRate = Number(ratePlanRow?.rate ?? 0);
  const total_amount = nightlyRate * nights;

  let booking_code = generateBookingCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("hotel_management_reservations")
      .select("id")
      .eq("booking_code", booking_code)
      .maybeSingle();
    if (!existing) break;
    booking_code = generateBookingCode();
  }

  const { data: reservation, error: reservationError } = await supabase
    .from("hotel_management_reservations")
    .insert({
      booking_code,
      guest_id: guest.id,
      room_id,
      check_in_date,
      check_out_date,
      adults: Number(adults),
      children: Number(children),
      rate_plan_id: ratePlanRow?.id ?? null,
      status: "confirmed",
      deposit_amount: Number(deposit_amount) || 0,
      total_amount,
      source,
      notes: notes || null,
    })
    .select("id, booking_code")
    .single();

  if (reservationError || !reservation) {
    return NextResponse.json(
      { error: reservationError?.message ?? "Failed to create reservation" },
      { status: 500 }
    );
  }

  await supabase
    .from("hotel_management_rooms")
    .update({ status: "reserved" })
    .eq("id", room_id);

  return NextResponse.json({
    success: true,
    reservation: {
      id: reservation.id,
      booking_code: reservation.booking_code,
    },
  });
}
