"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Locale, localeNames, locales } from "@/lib/i18n-config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();

  return (
    <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[.06] px-2 text-sm font-bold text-zinc-200">
      <Languages size={16} className="text-fuchsia-200" />
      <select
        aria-label="Language"
        value={locale}
        onChange={(event) => {
          document.cookie = `NEXT_LOCALE=${event.target.value}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
        className="max-w-28 bg-transparent text-sm font-bold outline-none"
      >
        {locales.map((item) => (
          <option key={item} value={item} className="bg-zinc-950 text-white">
            {localeNames[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
