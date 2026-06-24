"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ReferralBox({
  referralCode,
  referralCount,
}: {
  referralCode: string | null;
  referralCount: number;
}) {
  const [copied, setCopied] = useState(false);

  if (!referralCode) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/ref/${referralCode}`;

  function copy() {
    navigator.clipboard.writeText(link).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 truncate rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm font-mono text-violet-300">
          {link}
        </div>
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600/20 px-3 py-2.5 text-xs font-bold text-violet-200 transition hover:bg-violet-600/30"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>
          Code: <span className="font-black uppercase text-zinc-300">{referralCode}</span>
        </span>
        <span>·</span>
        <span>
          Successful referrals:{" "}
          <span className="font-black text-violet-300">{referralCount}</span>
        </span>
      </div>
    </div>
  );
}
