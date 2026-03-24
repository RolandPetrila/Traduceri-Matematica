"use client";

import { logAction } from "@/lib/monitoring";

export type TranslateEngine = "deepl" | "gemini";

interface EngineSelectorProps {
  engine: TranslateEngine;
  onEngineChange: (engine: TranslateEngine) => void;
}

const ENGINES: { id: TranslateEngine; label: string; description: string }[] = [
  { id: "deepl", label: "DeepL", description: "Cel mai bun RO\u2192SK (gratuit 500K/luna)" },
  { id: "gemini", label: "Gemini", description: "Gratuit nelimitat" },
];

export default function EngineSelector({ engine, onEngineChange }: EngineSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs opacity-50">Motor traducere:</span>
      {ENGINES.map((e) => (
        <button
          key={e.id}
          onClick={() => {
            if (e.id !== engine) {
              logAction("Engine traducere schimbat", { from: engine, to: e.id });
              onEngineChange(e.id);
            }
          }}
          className={`px-3 py-1 rounded text-xs font-bold transition-all ${
            engine === e.id
              ? "bg-chalk-yellow text-chalkboard"
              : "bg-white/10 text-chalk-white/60 hover:bg-white/20"
          }`}
          title={e.description}
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}
