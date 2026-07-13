import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

let supabaseUrl: string;
let supabaseAnonKey: string;

try {
  supabaseUrl = env.SUPABASE_URL ?? "";
  supabaseAnonKey = env.SUPABASE_ANON_KEY ?? "";
} catch {
  supabaseUrl = "";
  supabaseAnonKey = "";
}

// Client-side / anon client (for use in client components if needed)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side client with service role key (bypasses RLS)
// Use this in API routes and server actions for full access
export const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY && supabaseUrl
  ? createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase; // Fallback to anon key if service role not configured

/**
 * Returns the Supabase admin client, throwing if not configured.
 * Use this in server-side code that requires Supabase access.
 */
export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new AppError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
      500,
      "SUPABASE_NOT_CONFIGURED",
    );
  }
  return supabaseAdmin;
}
