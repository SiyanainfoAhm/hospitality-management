import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requirePermission, setDbRequestContext } from "@/lib/auth/permissions-server";
import { getSettlementPreview } from "@/lib/billing-server";

export async function GET(request: NextRequest) {
  const sessionOrDeny = await requirePermission("checkin_checkout", "view");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;
  await setDbRequestContext(sessionOrDeny.sub, sessionOrDeny.role);

  const reservationId = request.nextUrl.searchParams.get("reservation_id");
  if (!reservationId) {
    return NextResponse.json({ error: "reservation_id is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { settlement, error } = await getSettlementPreview(supabase, reservationId);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ settlement });
}
