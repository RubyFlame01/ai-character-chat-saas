import { NextResponse } from "next/server";
import { renewDueSubscriptions } from "@/lib/server/subscription-billing";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const renewed = await renewDueSubscriptions();
  return NextResponse.json({ renewed });
}
