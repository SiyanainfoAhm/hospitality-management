import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const invoiceId = request.nextUrl.searchParams.get("invoice_id");

  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
  }

  const { data: items, error } = await supabase
    .from("hotel_management_invoice_items")
    .select("id, description, category, quantity, unit_price, total_price")
    .eq("invoice_id", invoiceId)
    .order("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: items || [] });
}
