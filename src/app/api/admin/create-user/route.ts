import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/auth/permissions-server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { normalizeRole, type AppRole } from "@/lib/permissions";

const VALID_ROLES: AppRole[] = [
  "admin",
  "front_desk",
  "housekeeping",
  "fnb_manager",
  "accounts",
  "maintenance_staff",
];

export async function POST(request: NextRequest) {
  const sessionOrDeny = await requirePermission("user_management", "create");
  if (sessionOrDeny instanceof NextResponse) {
    return sessionOrDeny;
  }

  try {
    const body = await request.json();
    const { email, password, full_name, role } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "email, password, full_name, and role are required" },
        { status: 400 }
      );
    }

    const normalizedRole = normalizeRole(role);
    if (!VALID_ROLES.includes(normalizedRole as AppRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from("hotel_management_users")
      .insert({
        email: email.toLowerCase().trim(),
        password_hash,
        full_name,
        role: normalizedRole,
        is_active: true,
      })
      .select("id, email, full_name, role, is_active, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
