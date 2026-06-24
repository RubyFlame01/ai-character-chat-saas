"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/config";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
