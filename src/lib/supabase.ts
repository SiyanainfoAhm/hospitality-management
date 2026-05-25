import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client for realtime subscriptions only.
 * All data mutations go through Next.js API routes (which use the service role key).
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
    }
  );
}
