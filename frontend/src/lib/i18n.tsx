import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pt } from "./translations/pt";
import { en } from "./translations/en";

export type Lang = "pt" | "en";

// pt is the source of truth for the dictionary shape; en must match it.
export type Dict = typeof pt;

const DICTS: Record<Lang, Dict> = { pt, en };
const STORAGE_KEY = "shelf-lang";

export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
];

function initialLang(): Lang {
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (saved === "pt" || saved === "en") return saved;
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("pt")
    ? "pt"
    : "en";
}

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "pt",
  setLang: () => {},
  t: pt,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  function setLang(next: Lang) {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: DICTS[lang] }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
