import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
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
