import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  // Fetch invoices with guest and reservation details
  const { data: invoices, error: invErr } = await supabase
    .from("hotel_management_invoices")
    .select(`
      id,
      invoice_number,
      subtotal,
      discount_amount,
      tax_amount,
      total_amount,
      paid_amount,
      balance_amount,
      status,
      created_at,
      hotel_management_guests!guest_id (
        id, full_name, mobile, email
      ),
      hotel_management_reservations!reservation_id (
        id, booking_code,
        hotel_management_rooms!room_id (
          room_number
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (invErr) {
    return NextResponse.json({ error: invErr.message }, { status: 500 });
  }

  const formatted = (invoices || []).map((inv: any) => {
    const guest = inv.hotel_management_guests as any;
    const reservation = inv.hotel_management_reservations as any;
    const room = reservation?.hotel_management_rooms as any;

    return {
      id: inv.id,
      number: inv.invoice_number,
      guest: guest?.full_name ?? "Unknown",
      guest_email: guest?.email ?? "",
      room: room?.room_number ?? "—",
      date: inv.created_at?.split("T")[0] ?? "",
      subtotal: inv.subtotal,
      discount: inv.discount_amount,
      tax: inv.tax_amount,
      total: inv.total_amount,
      paid: inv.paid_amount,
      balance: inv.balance_amount,
      status: inv.status,
    };
  });

  return NextResponse.json({ invoices: formatted });
}

export async function POST() {
  // Fetch invoice items for a specific invoice (can be extended)
  return NextResponse.json({ error: "Use GET with invoice_id query param for items" }, { status: 400 });
}
