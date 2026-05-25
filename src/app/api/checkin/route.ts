import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // Arrivals: reservations with check_in_date = today and status confirmed
  const { data: arrivals, error: arrErr } = await supabase
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
      notes,
      hotel_management_guests!guest_id (
        id, full_name, mobile, email
      ),
      hotel_management_rooms!room_id (
        id, room_number, floor,
        hotel_management_room_types ( name, base_rate )
      ),
      hotel_management_rate_plans!rate_plan_id ( name, rate )
    `)
    .eq("check_in_date", today)
    .in("status", ["confirmed"])
    .order("check_in_date");

  // Departures: reservations with status checked_in and check_out_date <= today
  const { data: departures, error: depErr } = await supabase
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
      notes,
      hotel_management_guests!guest_id (
        id, full_name, mobile, email
      ),
      hotel_management_rooms!room_id (
        id, room_number, floor,
        hotel_management_room_types ( name, base_rate )
      ),
      hotel_management_rate_plans!rate_plan_id ( name, rate )
    `)
    .eq("status", "checked_in")
    .lte("check_out_date", today)
    .order("check_out_date");

  // Also get currently checked_in guests (for departures that aren't today but are checked in)
  const { data: allCheckedIn } = await supabase
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
      notes,
      hotel_management_guests!guest_id (
        id, full_name, mobile, email
      ),
      hotel_management_rooms!room_id (
        id, room_number, floor,
        hotel_management_room_types ( name, base_rate )
      ),
      hotel_management_rate_plans!rate_plan_id ( name, rate )
    `)
    .eq("status", "checked_in")
    .order("check_out_date");

  if (arrErr || depErr) {
    return NextResponse.json({ error: arrErr?.message || depErr?.message }, { status: 500 });
  }

  const formatReservation = (r: any) => {
    const guest = r.hotel_management_guests as any;
    const room = r.hotel_management_rooms as any;
    const roomType = room?.hotel_management_room_types as any;
    const ratePlan = r.hotel_management_rate_plans as any;
    const nights = Math.max(1, Math.ceil((new Date(r.check_out_date).getTime() - new Date(r.check_in_date).getTime()) / 86400000));

    return {
      id: r.id,
      booking_code: r.booking_code,
      guest_name: guest?.full_name ?? "Unknown",
      guest_mobile: guest?.mobile ?? "",
      guest_email: guest?.email ?? "",
      room_number: room?.room_number ?? "",
      room_type: roomType?.name ?? "Unknown",
      room_rate: ratePlan?.rate ?? roomType?.base_rate ?? 0,
      check_in_date: r.check_in_date,
      check_out_date: r.check_out_date,
      nights,
      adults: r.adults,
      children: r.children,
      status: r.status,
      total_amount: r.total_amount,
      deposit_amount: r.deposit_amount,
      notes: r.notes,
    };
  };

  return NextResponse.json({
    arrivals: (arrivals || []).map(formatReservation),
    departures: (allCheckedIn || []).map(formatReservation),
  });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const { reservation_id, action } = body;

  if (!reservation_id || !action) {
    return NextResponse.json({ error: "reservation_id and action are required" }, { status: 400 });
  }

  if (action === "checkin") {
    // Get reservation details
    const { data: reservation } = await supabase
      .from("hotel_management_reservations")
      .select("id, room_id")
      .eq("id", reservation_id)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Update reservation status
    await supabase
      .from("hotel_management_reservations")
      .update({ status: "checked_in" })
      .eq("id", reservation_id);

    // Update room status
    await supabase
      .from("hotel_management_rooms")
      .update({ status: "checked_in" })
      .eq("id", reservation.room_id);

    // Create checkin record
    await supabase
      .from("hotel_management_checkins")
      .insert({
        reservation_id,
        room_id: reservation.room_id,
        checked_in_at: new Date().toISOString(),
      });

    return NextResponse.json({ success: true, message: "Guest checked in" });
  }

  if (action === "checkout") {
    const { data: reservation } = await supabase
      .from("hotel_management_reservations")
      .select("id, room_id")
      .eq("id", reservation_id)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Update reservation status
    await supabase
      .from("hotel_management_reservations")
      .update({ status: "checked_out" })
      .eq("id", reservation_id);

    // Update room status to dirty (needs cleaning)
    await supabase
      .from("hotel_management_rooms")
      .update({ status: "dirty" })
      .eq("id", reservation.room_id);

    // Update checkin record with checkout time
    await supabase
      .from("hotel_management_checkins")
      .update({ checked_out_at: new Date().toISOString() })
      .eq("reservation_id", reservation_id)
      .is("checked_out_at", null);

    return NextResponse.json({ success: true, message: "Guest checked out" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
