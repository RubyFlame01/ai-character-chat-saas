"use client";

import { useEffect } from "react";
import type { Paddle, PaddleEventData } from "@paddle/paddle-js";

let globalPaddle: Paddle | null = null;
let initPromise: Promise<Paddle | null> | null = null;
let lastErrorHandler: ((message: string) => void) | null = null;

function getPaddle(): Promise<Paddle | null> {
  if (globalPaddle) return Promise.resolve(globalPaddle);
  if (initPromise) return initPromise;

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!clientToken) return Promise.resolve(null);

  initPromise = import("@paddle/paddle-js").then(({ initializePaddle }) =>
    initializePaddle({
      token: clientToken,
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "production") as "sandbox" | "production",
      eventCallback: (event: PaddleEventData) => {
        if (event.name === "checkout.error" && lastErrorHandler) {
          lastErrorHandler("Checkout could not be opened. Please try again later.");
        }
      },
    }).then((paddle) => {
      globalPaddle = paddle ?? null;
      return globalPaddle;
    })
  );

  return initPromise;
}

export function isPaddleConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN);
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
    onError,
  }: {
    priceId: string;
    userId: string;
    userEmail?: string;
    onError?: (message: string) => void;
  }): Promise<boolean> {
    const paddle = await getPaddle();
    if (!paddle) {
      onError?.("Payment system is not available right now. Please try again later.");
      return false;
    }

    lastErrorHandler = onError ?? null;

    try {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { user_id: userId },
        ...(userEmail ? { customer: { email: userEmail } } : {}),
      });
      return true;
    } catch {
      onError?.("Checkout could not be opened. Please try again later.");
      return false;
    }
  }

  return { openCheckout };
}
