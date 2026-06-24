import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { subject, body } = (await request.json()) as { subject?: string; body?: string };

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  if (!hasSupabaseAdminEnv()) {
    // Demo mode — just acknowledge
    return NextResponse.json({ ok: true });
  }

  const user = await getCurrentUser();
  const supabase = createSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("support_messages").insert({
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    subject: subject.trim(),
    body: body.trim(),
  });

  if (error) {
    console.error("support insert error", error);
    return NextResponse.json({ error: "Failed to save message." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
