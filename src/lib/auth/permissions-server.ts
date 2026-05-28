import { NextResponse } from "next/server";
import { getSession, type JWTPayload } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  canAccess,
  normalizeRole,
  type Module,
  type PermissionAction,
} from "@/config/rbac";

export async function requireSession(): Promise<JWTPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export async function requirePermission(
  module: Module,
  action: PermissionAction = "view"
): Promise<JWTPayload | NextResponse> {
  const sessionOrResponse = await requireSession();
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const role = normalizeRole(sessionOrResponse.role);
  if (!role || !canAccess(role, module, action)) {
    return NextResponse.json(
      { error: "Forbidden", message: `You do not have permission to ${action} ${module}` },
      { status: 403 }
    );
  }

  return sessionOrResponse;
}

export async function setDbRequestContext(userId: string, role: string) {
  try {
    const supabase = createServerSupabaseClient();
    const normalized = normalizeRole(role);
    await supabase.rpc("set_request_context", {
      p_user_id: userId,
      p_role: normalized ?? role,
    });
  } catch {
    // optional until migration applied
  }
}
