import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
