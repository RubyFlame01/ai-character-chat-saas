import type { Locale } from "@/lib/i18n-config";
import type { Dictionary } from "./types";
import { ar } from "./ar";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { hi } from "./hi";
import { id } from "./id";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { nl } from "./nl";
import { pl } from "./pl";
import { pt } from "./pt";
import { ru } from "./ru";
import { tr } from "./tr";
import { zh } from "./zh";

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  tr,
  es,
  fr,
  de,
  it,
  pt,
  nl,
  pl,
  ru,
  ar,
  hi,
  id,
  ja,
  ko,
  zh,
};
