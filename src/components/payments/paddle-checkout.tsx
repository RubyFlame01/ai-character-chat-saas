"use client";

import { useEffect, useRef, useState } from "react";
import type { Paddle } from "@paddle/paddle-js";

let globalPaddle: Paddle | null = null;
let initPromise: Promise<Paddle | null> | null = null;

function getPaddle(): Promise<Paddle | null> {
  if (globalPaddle) return Promise.resolve(globalPaddle);
  if (initPromise) return initPromise;

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!clientToken) return Promise.resolve(null);

  initPromise = import("@paddle/paddle-js").then(({ initializePaddle }) =>
    initializePaddle({
      token: clientToken,
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "production") as "sandbox" | "production",
    }).then((paddle) => {
      globalPaddle = paddle ?? null;
      return globalPaddle;
    })
  );

  return initPromise;
}

export function usePaddleCheckout() {
  useEffect(() => {
    // Eagerly initialize on mount so it's ready when user clicks
    getPaddle();
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
    const paddle = await getPaddle();
    if (!paddle) {
      console.error("Paddle not initialized");
      return;
    }

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: { user_id: userId },
      ...(userEmail ? { customer: { email: userEmail } } : {}),
    });
  }

  return { openCheckout };
}
