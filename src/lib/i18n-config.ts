export const defaultLocale = "en";

export const locales = [
  "en",
  "tr",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "ru",
  "ar",
  "hi",
  "id",
  "ja",
  "ko",
  "zh",
] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  ru: "Русский",
  ar: "العربية",
  hi: "हिन्दी",
  id: "Bahasa Indonesia",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function getDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function detectLocale(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const weighted = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q = "q=1"] = part.trim().split(";");
      return {
        locale: tag.toLowerCase().split("-")[0],
        q: Number(q.replace("q=", "")) || 0,
      };
    })
    .sort((a, b) => b.q - a.q);

  return (weighted.find((item) => isLocale(item.locale))?.locale as Locale | undefined) ?? defaultLocale;
}
