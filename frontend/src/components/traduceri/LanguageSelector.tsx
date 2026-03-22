"use client";

const LANGUAGES = [
  { code: "ro", name: "Romana", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "sk", name: "Slovaca", flag: "\u{1F1F8}\u{1F1F0}" },
  { code: "en", name: "Engleza", flag: "\u{1F1EC}\u{1F1E7}" },
];

interface LanguageSelectorProps {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
}

export default function LanguageSelector({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
}: LanguageSelectorProps) {
  const swap = () => {
    onSourceChange(targetLang);
    onTargetChange(sourceLang);
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <div>
        <label className="block text-sm opacity-60 mb-1">Din limba:</label>
        <select
          value={sourceLang}
          onChange={(e) => onSourceChange(e.target.value)}
          className="bg-white/10 border border-chalk-white/20 rounded-lg px-4 py-2 text-chalk-white appearance-none cursor-pointer"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-chalkboard text-chalk-white">
              {l.flag} {l.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={swap}
        className="mt-5 text-2xl hover:scale-110 transition-transform"
        title="Inverseaza limbile"
      >
        &#x21C4;
      </button>

      <div>
        <label className="block text-sm opacity-60 mb-1">In limba:</label>
        <select
          value={targetLang}
          onChange={(e) => onTargetChange(e.target.value)}
          className="bg-white/10 border border-chalk-white/20 rounded-lg px-4 py-2 text-chalk-white appearance-none cursor-pointer"
        >
          {LANGUAGES.filter((l) => l.code !== sourceLang).map((l) => (
            <option key={l.code} value={l.code} className="bg-chalkboard text-chalk-white">
              {l.flag} {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
