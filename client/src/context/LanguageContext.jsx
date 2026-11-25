import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "../i18n/en.js";
import rw from "../i18n/rw.js";

const LanguageContext = createContext(null);
const DICTS = { en, rw };
const STORAGE_KEY = "lovaction_language";

function interpolate(text, vars) {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    vars[key] !== undefined ? String(vars[key]) : match
  );
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "rw" ? "rw" : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next === "rw" ? "rw" : "en");
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((current) => (current === "en" ? "rw" : "en"));
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = DICTS[lang] || en;
      const value = dict[key] ?? en[key] ?? key;
      return interpolate(value, vars);
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
