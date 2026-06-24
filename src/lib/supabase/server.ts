import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/config";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server components cannot set cookies; middleware/route handlers can.
        }
      },
    },
  });
}
