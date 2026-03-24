"use client";

import { useLanguage, type Lang } from "@/lib/language-context";
import { logAction } from "@/lib/monitoring";

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "ro", label: "RO", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "sk", label: "SK", flag: "\u{1F1F8}\u{1F1F0}" },
  { code: "en", label: "EN", flag: "\u{1F1EC}\u{1F1E7}" },
];

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  const handleChange = (newLang: Lang) => {
    if (newLang === lang) return;
    logAction("Limba schimbata (toggle)", { from: lang, to: newLang });
    setLang(newLang);
  };

  return (
    <div className="flex gap-1">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => handleChange(l.code)}
          className={`px-2 py-1 rounded text-xs font-bold transition-all ${
            lang === l.code
              ? "bg-chalk-yellow text-chalkboard"
              : "bg-white/10 text-chalk-white/60 hover:bg-white/20"
          }`}
          title={`Traducere: ${l.label}`}
        >
          {l.flag} {l.label}
        </button>
      ))}
    </div>
  );
}
