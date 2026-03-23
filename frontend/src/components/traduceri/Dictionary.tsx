"use client";

import { useState, useEffect } from "react";

interface DictEntry {
  source: string;
  target: string;
  domain: string;
}

interface DictionaryProps {
  sourceLang: string;
  targetLang: string;
}

const DICT_FILES: Record<string, string> = {
  "ro_sk": "/data/math_terms_ro_sk.json",
  "ro_en": "/data/math_terms_ro_en.json",
};

const DOMAIN_LABELS: Record<string, string> = {
  geometrie: "Geometrie",
  geometry: "Geometrie",
  algebra: "Algebra",
  aritmetica: "Aritmetica",
  arithmetic: "Aritmetica",
  analiza: "Analiza",
  analysis: "Analiza",
  statistica: "Statistica",
  statistics: "Statistica",
  combinatorica: "Combinatorica",
  combinatorics: "Combinatorica",
  general: "General",
};

export default function Dictionary({ sourceLang, targetLang }: DictionaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<DictEntry[]>([]);
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [loaded, setLoaded] = useState(false);

  const storageKey = `dict_${sourceLang}_${targetLang}`;
  const dictFileKey = `${sourceLang}_${targetLang}`;

  // Load entries: first from localStorage, then merge pre-populated if first time
  useEffect(() => {
    const savedRaw = localStorage.getItem(storageKey);
    if (savedRaw) {
      setEntries(JSON.parse(savedRaw));
      setLoaded(true);
      return;
    }

    // First time — try to load pre-populated dict
    const dictFile = DICT_FILES[dictFileKey];
    if (dictFile) {
      fetch(dictFile)
        .then((r) => r.ok ? r.json() : [])
        .then((data: DictEntry[]) => {
          setEntries(data);
          localStorage.setItem(storageKey, JSON.stringify(data));
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [sourceLang, targetLang, storageKey, dictFileKey]);

  const save = (updated: DictEntry[]) => {
    setEntries(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const addEntry = () => {
    if (!newSource.trim() || !newTarget.trim()) return;
    // Avoid duplicates
    if (entries.some((e) => e.source.toLowerCase() === newSource.trim().toLowerCase())) return;
    save([...entries, { source: newSource.trim(), target: newTarget.trim(), domain: "manual" }]);
    setNewSource("");
    setNewTarget("");
  };

  const removeEntry = (index: number) => {
    save(entries.filter((_, i) => i !== index));
  };

  const resetToDefaults = () => {
    const dictFile = DICT_FILES[dictFileKey];
    if (!dictFile) return;
    fetch(dictFile)
      .then((r) => r.ok ? r.json() : [])
      .then((data: DictEntry[]) => save(data))
      .catch(() => {});
  };

  // Get unique domains for filtering
  const domains = Array.from(new Set(entries.map((e) => e.domain))).sort();

  const filtered = entries.filter((e) => {
    const matchesSearch =
      !search ||
      e.source.toLowerCase().includes(search.toLowerCase()) ||
      e.target.toLowerCase().includes(search.toLowerCase());
    const matchesDomain = !filterDomain || e.domain === filterDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="border border-chalk-white/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-3 bg-white/5 hover:bg-white/8 transition"
      >
        <span className="font-bold">
          &#x1F4D6; Dictionar terminologic ({entries.length} termeni)
        </span>
        <span className="text-chalk-yellow">{isOpen ? "\u25B2" : "\u25BC"}</span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3">
          {/* Search + domain filter */}
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cauta termen..."
              className="flex-1 bg-white/10 border border-chalk-white/20 rounded px-3 py-2 text-sm"
            />
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="bg-white/10 border border-chalk-white/20 rounded px-3 py-2 text-sm text-chalk-white"
            >
              <option value="">Toate domeniile</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {DOMAIN_LABELS[d] || d}
                </option>
              ))}
            </select>
          </div>

          {/* Add new */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder={`Termen ${sourceLang.toUpperCase()}`}
              className="flex-1 bg-white/10 border border-chalk-white/20 rounded px-3 py-2 text-sm"
            />
            <span className="self-center opacity-40">&#x2192;</span>
            <input
              type="text"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder={`Traducere ${targetLang.toUpperCase()}`}
              className="flex-1 bg-white/10 border border-chalk-white/20 rounded px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
            />
            <button onClick={addEntry} className="chalk-btn text-sm">
              + Adauga
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <span className="text-xs opacity-40">
              {filtered.length} din {entries.length} termeni
              {filterDomain && ` (${DOMAIN_LABELS[filterDomain] || filterDomain})`}
            </span>
            {DICT_FILES[dictFileKey] && (
              <button
                onClick={resetToDefaults}
                className="text-xs text-chalk-blue hover:opacity-80"
              >
                Reseteaza la default
              </button>
            )}
          </div>

          {/* Entries list */}
          {!loaded ? (
            <p className="text-sm opacity-40 text-center py-4">Se incarca...</p>
          ) : filtered.length > 0 ? (
            <div className="max-h-60 overflow-auto space-y-1">
              {filtered.map((entry, i) => (
                <div
                  key={`${entry.source}-${i}`}
                  className="flex items-center justify-between bg-white/5 rounded px-3 py-2 text-sm"
                >
                  <span className="flex-1">
                    <strong>{entry.source}</strong>
                    <span className="opacity-40 mx-2">&#x2192;</span>
                    <span className="text-chalk-yellow">{entry.target}</span>
                    <span className="ml-2 text-xs opacity-30">
                      [{DOMAIN_LABELS[entry.domain] || entry.domain}]
                    </span>
                  </span>
                  <button
                    onClick={() => removeEntry(entries.indexOf(entry))}
                    className="text-chalk-red hover:opacity-80 ml-2"
                  >
                    &#x2715;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-40 text-center py-4">
              {entries.length === 0
                ? "Niciun termen salvat. Adauga termeni pentru consistenta traducerilor."
                : "Niciun rezultat pentru cautare."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
