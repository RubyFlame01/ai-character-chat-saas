"use client";

import { useEffect, useRef } from "react";
import type { Paddle } from "@paddle/paddle-js";

declare global {
  interface Window {
    Paddle?: Paddle;
  }
}

let paddleInitialized = false;

export function usePaddleCheckout() {
  const paddleRef = useRef<Paddle | null>(null);

  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!clientToken || paddleInitialized) return;

    import("@paddle/paddle-js").then(({ initializePaddle }) => {
      initializePaddle({
        token: clientToken,
        environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "production") as "sandbox" | "production",
      }).then((paddle) => {
        if (paddle) {
          paddleRef.current = paddle;
          paddleInitialized = true;
        }
      });
    });
  }, []);

  async function openCheckout({
    priceId,
    userId,
    userEmail,
  }: {
    priceId: string;
    userId: string;
    userEmail?: string;
  }) {
    const paddle = paddleRef.current;
    if (!paddle) return;

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: { user_id: userId },
      ...(userEmail ? { customer: { email: userEmail } } : {}),
    });
  }

  return { openCheckout };
}
