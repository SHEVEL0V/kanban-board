"use client";

import * as React from "react";
import type { Dictionary, Locale } from "@/shared/i18n/get-dictionary";

type DictionaryContextValue = {
  dict: Dictionary;
  locale: Locale;
};

const DictionaryContext = React.createContext<DictionaryContextValue | null>(null);

export function DictionaryProvider({
  dict,
  locale,
  children,
}: DictionaryContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ dict, locale }), [dict, locale]);
  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>;
}

export function useDictionary(): DictionaryContextValue {
  const context = React.useContext(DictionaryContext);
  if (!context) {
    throw new Error("useDictionary must be used within a DictionaryProvider");
  }
  return context;
}
