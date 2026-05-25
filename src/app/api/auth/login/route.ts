import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

const DEMO_USERS: Record<string, { id: string; role: string; name: string; password: string }> = {
  "admin@iimn.ac.in": { id: "00000000-0000-0000-0000-000000000001", role: "admin", name: "Admin User", password: "admin123" },
  "frontdesk@iimn.ac.in": { id: "00000000-0000-0000-0000-000000000002", role: "front_desk", name: "Priya Sharma", password: "desk123" },
  "hk@iimn.ac.in": { id: "00000000-0000-0000-0000-000000000003", role: "housekeeping", name: "Ramesh Kumar", password: "hk123" },
  "fnb@iimn.ac.in": { id: "00000000-0000-0000-0000-000000000004", role: "fnb", name: "Suresh Patel", password: "fnb123" },
  "accounts@iimn.ac.in": { id: "00000000-0000-0000-0000-000000000005", role: "accounts", name: "Anita Verma", password: "acc123" },
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // If Supabase is configured, use real database auth
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createServerSupabaseClient } = await import("@/lib/supabase-server");
      const supabase = createServerSupabaseClient();

      const { data: user, error } = await supabase
        .from("hotel_management_users")
        .select("id, email, full_name, role, is_active, password_hash")
        .eq("email", normalizedEmail)
        .single();

      if (error || !user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      if (!user.is_active) {
        return NextResponse.json({ error: "Account is deactivated." }, { status: 403 });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      await supabase
        .from("hotel_management_users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id);

      const token = await signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name ?? "",
      });

      const response = NextResponse.json({
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      });

      response.cookies.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      return response;
    }

    // Demo mode fallback (no database)
    const demoUser = DEMO_USERS[normalizedEmail];
    if (!demoUser || demoUser.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken({
      sub: demoUser.id,
      email: normalizedEmail,
      role: demoUser.role,
      full_name: demoUser.name,
    });

    const response = NextResponse.json({
      user: { id: demoUser.id, email: normalizedEmail, full_name: demoUser.name, role: demoUser.role },
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
