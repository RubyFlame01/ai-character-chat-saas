"use client";

import { Suspense } from "react";
import { AuthModal } from "./auth-modal";

export function AuthModalShell() {
  return (
    <Suspense>
      <AuthModal />
    </Suspense>
  );
}
