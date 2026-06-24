import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.id === "demo-user") {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { displayName } = (await request.json()) as { displayName?: string };
  if (!displayName?.trim()) {
    return NextResponse.json({ error: "Display name is required." }, { status: 400 });
  }

  if (!hasSupabaseBrowserEnv()) return NextResponse.json({ ok: true });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("users_profile")
    .update({ display_name: displayName.trim() })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.id === "demo-user") {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { confirm } = (await request.json()) as { confirm?: string };
  if (confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }

  if (!hasSupabaseBrowserEnv()) return NextResponse.json({ ok: true });

  // Delete from Supabase Auth (cascades to users_profile via FK)
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  await admin.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
