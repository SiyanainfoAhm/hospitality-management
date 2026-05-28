import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { normalizeRole } from "@/config/rbac";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const role = normalizeRole(session.role);
  if (!role) {
    return NextResponse.json({ user: null, error: "Invalid role" }, { status: 403 });
  }

  let full_name = session.full_name;
  let is_active = true;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createServerSupabaseClient();
    const { data: userRow } = await supabase
      .from("hotel_management_users")
      .select("full_name, is_active, role")
      .eq("id", session.sub)
      .single();

    if (userRow) {
      full_name = userRow.full_name ?? full_name;
      is_active = userRow.is_active;
    }
  }

  return NextResponse.json({
    user: {
      id: session.sub,
      email: session.email,
      role,
      full_name,
      is_active,
    },
  });
}
