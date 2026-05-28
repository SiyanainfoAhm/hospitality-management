import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { normalizeRole } from "@/lib/permissions";

/**
 * User-scoped Supabase client for RLS-enforced queries.
 * Signs a short-lived JWT with `sub` = user id and `app_role` claim.
 * Requires SUPABASE_JWT_SECRET (Project Settings → API → JWT Secret).
 */
export async function createUserSupabaseClient(
  userId: string,
  role: string
): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (!url || !anonKey || !jwtSecret) {
    return null;
  }

  const secret = new TextEncoder().encode(jwtSecret);
  const accessToken = await new SignJWT({
    sub: userId,
    role: "authenticated",
    app_role: normalizeRole(role),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  const client = createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });

  await client.rpc("set_request_context", {
    p_user_id: userId,
    p_role: normalizeRole(role),
  });

  return client;
}
