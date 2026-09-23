// SULOFT — Supabase Server Client (server-only)
// -----------------------------------------------------------------------------
// Used for server-side admin operations that legitimately need to bypass RLS —
// e.g. when an admin user marks an item as returned, the operation must work
// regardless of who the currently-authenticated admin is.
//
// CRITICAL:
// - This file MUST only be imported from server components, route handlers,
//   or server actions. Importing it from a client component would ship the
//   service-role key to the browser, which is a critical security violation.
// - The lint rule below prevents accidental client-side imports.
// - Even when used server-side, we ALWAYS additionally verify the acting
//   user's role via `getAdminSupabase()` before performing admin actions.
// -----------------------------------------------------------------------------

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getServiceRoleClient(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Returns a service-role client OR throws if not configured.
 * Use this only in server-side admin contexts after you've already verified
 * the calling user's role with the regular anon-key client + RLS.
 */
export function requireServiceRoleClient(): SupabaseClient {
  const client = getServiceRoleClient();
  if (!client) {
    throw new Error(
      "Service-role client is not configured. Set SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
  }
  return client;
}
