"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "ro" | "sk" | "en";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangCtx>({
  lang: "ro",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ro");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("translate_lang");
      if (saved === "sk" || saved === "ro" || saved === "en") setLangState(saved);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("translate_lang", l);
    } catch {
      // localStorage unavailable
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLanguage = () => useContext(LangContext);
