// SULOFT — Supabase Browser Client
// -----------------------------------------------------------------------------
// This is the public Supabase client used by every browser component.
//
// Security model:
// - Uses ONLY the anon/publishable key (NEXT_PUBLIC_SUPABASE_ANON_KEY).
// - The anon key is designed to be public — it cannot bypass RLS.
// - Every database operation goes through Row Level Security policies
//   defined in `supabase/schema.sql`. Even if someone steals this key,
//   they cannot read or write data they're not authorized for.
// - The service-role key (which CAN bypass RLS) is NEVER imported here.
//   It is only used by `src/lib/supabase/server.ts` for server-side admin work.
// -----------------------------------------------------------------------------

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("YOUR-PROJECT-REF")
);

let client: SupabaseClient | null = null;

/**
 * Returns the singleton browser Supabase client.
 * Falls back to a no-op-style client (still callable, will fail on real requests)
 * when env vars are missing — the UI shows a SetupBanner in that case.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  client = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-anon-key",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  return client;
}

export const supabase = getSupabase();
