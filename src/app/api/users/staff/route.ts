import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requireSession } from "@/lib/auth/permissions-server";
import { canAccess, normalizeRole } from "@/config/rbac";

/** List staff by role for assignment dropdowns */
export async function GET(request: Request) {
  const sessionOrDeny = await requireSession();
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const role = normalizeRole(sessionOrDeny.role);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get("role");
  const rolesParam = searchParams.get("roles");
  const includeInactive = searchParams.get("include_inactive") === "true";

  const mayListStaff =
    canAccess(role, "maintenance", "assign") ||
    canAccess(role, "housekeeping", "assign") ||
    canAccess(role, "user_management", "view");
  if (!mayListStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("hotel_management_users")
    .select("id, full_name, email, role, is_active")
    .order("full_name");

  if (!(includeInactive && canAccess(role, "user_management", "view"))) {
    query = query.eq("is_active", true);
  }

  const roleFilters = rolesParam
    ? rolesParam.split(",").map((r) => r.trim()).filter(Boolean)
    : roleFilter
      ? [roleFilter]
      : [];

  if (roleFilters.length === 1) {
    query = query.eq("role", roleFilters[0]);
  } else if (roleFilters.length > 1) {
    query = query.in("role", roleFilters);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}
