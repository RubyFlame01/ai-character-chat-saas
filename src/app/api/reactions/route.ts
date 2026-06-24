import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.id === "demo-user") {
    return NextResponse.json({ ok: true }); // silently succeed for demo
  }

  const { messageId, reaction } = (await request.json()) as {
    messageId?: string;
    reaction?: "up" | "down" | null;
  };

  if (!messageId) return NextResponse.json({ error: "messageId required." }, { status: 400 });

  if (!hasSupabaseAdminEnv()) return NextResponse.json({ ok: true });

  const supabase = createSupabaseAdminClient();

  if (!reaction) {
    // Remove reaction
    await (supabase as any)
      .from("message_reactions")
      .delete()
      .eq("user_id", user.id)
      .eq("message_id", messageId);
  } else {
    // Upsert reaction
    await (supabase as any).from("message_reactions").upsert(
      { user_id: user.id, message_id: messageId, reaction },
      { onConflict: "user_id,message_id" },
    );
  }

  return NextResponse.json({ ok: true });
}
