import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requirePermission } from "@/lib/auth/permissions-server";

/** List staff by role for assignment dropdowns */
export async function GET(request: Request) {
  const sessionOrDeny = await requirePermission("dashboard", "view");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get("role");

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("hotel_management_users")
    .select("id, full_name, email, role")
    .eq("is_active", true)
    .order("full_name");

  if (roleFilter) {
    query = query.eq("role", roleFilter);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}
