import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "brand-gradient text-white shadow-[0_8px_32px_rgba(192,38,211,.35)] hover:brightness-110 hover:shadow-[0_8px_40px_rgba(192,38,211,.5)]",
  secondary:
    "border border-white/12 bg-white/[.06] text-white backdrop-blur hover:border-fuchsia-300/40 hover:bg-white/[.1]",
  ghost: "text-zinc-300 hover:bg-white/[.06] hover:text-white",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-fuchsia-300/60 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function LinkButton({
  className,
  variant = "primary",
  href,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-fuchsia-300/60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
