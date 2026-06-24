"use client";

import { useState } from "react";
import { AGE_GATE_COOKIE } from "@/lib/age-gate";

type AgeGateProps = {
  title: string;
  description: string;
  confirm: string;
  exit: string;
};

export function AgeGate({ title, description, confirm, exit }: AgeGateProps) {
  const [accepted, setAccepted] = useState(false);

  if (accepted) return null;

  const accept = () => {
    document.cookie = `${AGE_GATE_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setAccepted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center shadow-2xl">
        <p className="text-5xl font-black text-fuchsia-500">18+</p>
        <h2 className="mt-4 text-2xl font-bold text-white">{title}</h2>
        <p className="mt-4 text-sm leading-6 text-zinc-400">{description}</p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-fuchsia-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-500"
          >
            {confirm}
          </button>
          <a
            href="https://www.google.com"
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-400 transition hover:text-white"
          >
            {exit}
          </a>
        </div>
      </div>
    </div>
  );
}
