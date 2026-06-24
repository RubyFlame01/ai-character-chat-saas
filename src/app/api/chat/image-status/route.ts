// This route is kept for any legacy polling calls.
// Chat image generation now uses Venice AI (synchronous) and returns imageDataUrl
// directly in the /api/chat response — no polling needed.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "failed" });
}
