import "server-only";

import { cookies } from "next/headers";
import uk from "@/shared/i18n/dictionaries/uk.json";
import en from "@/shared/i18n/dictionaries/en.json";

export type Dictionary = typeof uk;
export type Locale = "uk" | "en";

export const LOCALE_COOKIE = "lang";

const dictionaries: Record<Locale, Dictionary> = {
  uk,
  en: en satisfies Dictionary,
};

export async function getLocale(): Promise<Locale> {
  const locale = (await cookies()).get(LOCALE_COOKIE)?.value;
  return locale === "en" ? "en" : "uk";
}

export async function getDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] };
}
