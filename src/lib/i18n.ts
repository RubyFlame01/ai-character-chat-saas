import { cookies, headers } from "next/headers";
import { dictionaries, type Dictionary } from "@/lib/dictionaries";
import {
  defaultLocale,
  detectLocale,
  getDirection,
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n-config";

export { defaultLocale, getDirection, locales, type Dictionary, type Locale };

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export async function getLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = (await headers()).get("accept-language");
  const detected = detectLocale(acceptLanguage);
  return detected;
}

export function alternates(path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return Object.fromEntries(
    locales.map((locale) => [locale, `${base.replace(/\/$/, "")}${cleanPath}?lang=${locale}`]),
  );
}
