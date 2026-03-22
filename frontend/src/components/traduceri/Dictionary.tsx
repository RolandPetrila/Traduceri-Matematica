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

export default function Dictionary({ sourceLang, targetLang }: DictionaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<DictEntry[]>([]);
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const key = `dict_${sourceLang}_${targetLang}`;
    const saved = localStorage.getItem(key);
    if (saved) setEntries(JSON.parse(saved));
  }, [sourceLang, targetLang]);

  const save = (updated: DictEntry[]) => {
    setEntries(updated);
    const key = `dict_${sourceLang}_${targetLang}`;
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const addEntry = () => {
    if (!newSource.trim() || !newTarget.trim()) return;
    save([...entries, { source: newSource, target: newTarget, domain: "math" }]);
    setNewSource("");
    setNewTarget("");
  };

  const removeEntry = (index: number) => {
    save(entries.filter((_, i) => i !== index));
  };

  const filtered = entries.filter(
    (e) =>
      e.source.toLowerCase().includes(search.toLowerCase()) ||
      e.target.toLowerCase().includes(search.toLowerCase())
  );

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
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cauta termen..."
            className="w-full bg-white/10 border border-chalk-white/20 rounded px-3 py-2 text-sm"
          />

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

          {/* Entries list */}
          {filtered.length > 0 ? (
            <div className="max-h-60 overflow-auto space-y-1">
              {filtered.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/5 rounded px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{entry.source}</strong>
                    <span className="opacity-40 mx-2">&#x2192;</span>
                    <span className="text-chalk-yellow">{entry.target}</span>
                  </span>
                  <button
                    onClick={() => removeEntry(i)}
                    className="text-chalk-red hover:opacity-80"
                  >
                    &#x2715;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-40 text-center py-4">
              Niciun termen salvat. Adauga termeni pentru consistenta traducerilor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
