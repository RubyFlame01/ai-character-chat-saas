import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { getCurrentUser } from "@/lib/server/auth";
import { deleteAllUserConversations, deleteConversation } from "@/lib/server/conversations";

const deleteSchema = z.object({
  conversationId: z.string().uuid().optional(), // omit to delete ALL
});

export async function DELETE(request: Request) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user || user.id === "demo-user") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (parsed.data.conversationId) {
    await deleteConversation(parsed.data.conversationId, user.id);
  } else {
    await deleteAllUserConversations(user.id);
  }

  return NextResponse.json({ ok: true });
}
