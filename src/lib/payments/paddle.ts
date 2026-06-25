import { env } from "@/lib/config";
import type { CheckoutInput, CheckoutResult } from "./types";

// Paddle client-side overlay checkout: returns a special URL that the frontend
// intercepts to open the Paddle overlay instead of redirecting.
export const paddlePaymentProvider = {
  name: "paddle",

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    // We use client-side overlay checkout — no server-side session needed.
    // Return a paddle:// URL that the frontend PaddleCheckout component handles.
    const { planId } = input;
    return {
      provider: "paddle",
      orderId: `paddle_${planId}_${Date.now()}`,
      checkoutUrl: `paddle://checkout?planId=${planId}`,
    };
  },
};

export async function verifyPaddleWebhook(
  body: string,
  signature: string
): Promise<boolean> {
  const secret = env.paddleWebhookSecret;
  if (!secret) return true; // skip verification if not configured

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Paddle sends: ts=<timestamp>;h1=<hmac>
  const parts = signature.split(";");
  const tsPart = parts.find((p) => p.startsWith("ts="));
  const h1Part = parts.find((p) => p.startsWith("h1="));
  if (!tsPart || !h1Part) return false;

  const ts = tsPart.slice(3);
  const h1 = h1Part.slice(3);
  const signed = `${ts}:${body}`;

  const sigBytes = Uint8Array.from(
    h1.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  );

  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(signed));
}
