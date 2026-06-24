import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("users_profile")
    .select("id,email,display_name,credits,subscription_tier,subscription_status,is_admin,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) query = query.ilike("email", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}
