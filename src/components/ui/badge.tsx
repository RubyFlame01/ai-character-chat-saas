import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-white/10 bg-white/[.06] px-2.5 py-1 text-xs font-semibold text-zinc-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
