"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendChat, type ChatMessage } from "@/lib/chat-providers";
import { buildSystemPrompt } from "@/lib/chat-context";
import { renderMathText } from "@/lib/math-html";
import { ensureImageUnderCap } from "@/lib/image-downscale";
import { API_URL } from "@/lib/api-url";
import {
  CLASSES,
  DIFFICULTIES,
  ITEM_TYPES,
  classGroups,
  buildGeneratePrompt,
  buildCorrectPrompt,
  type Difficulty,
  type ItemTypeKey,
} from "@/lib/test-generator";

/**
 * Modul TESTE (2026-08-04, mock §17 aprobat). Generează (AI, pe clasă+temă+
 * dificultate → trimite în Editor) + Corectează (poză → OCR → AI: greșeli+notă).
 * Reutilizează lanțul AI (chat-providers), biblioteca de teme (test-generator),
 * OCR-ul și puntea „trimite în editor". Temă verde.
 */
export function TestePanel({
  onSendToEditor,
}: {
  onSendToEditor?: (text: string) => void;
}) {
  return (
    <div className="w-full rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
      <Tabs defaultValue="genereaza" className="w-full">
        <TabsList className="mb-3 grid w-full grid-cols-2">
          <TabsTrigger value="genereaza">Generează</TabsTrigger>
          <TabsTrigger value="corecteaza">Corectează</TabsTrigger>
        </TabsList>
        <TabsContent value="genereaza">
          <GenerateTab onSendToEditor={onSendToEditor} />
        </TabsContent>
        <TabsContent value="corecteaza">
          <CorrectTab onSendToEditor={onSendToEditor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Trunchiere la limita de tokeni (ChatPanel.tsx are acelasi pattern) — mesajul-prompt
 * de continuare, trimis modelului, nu afisat in UI. */
const CONTINUE_PROMPT =
  "Continuă exact de unde ai rămas, fără să reiei ce ai scris deja.";

/* ──────────────────────────────── Generează ──────────────────────────────── */

const DEFAULT_COUNTS: Record<ItemTypeKey, number> = {
  grila: 5,
  completare: 3,
  probleme: 2,
  adevfals: 0,
  corespondenta: 0,
};

/** Stepper compact − N + pentru numărul de itemi dintr-un tip (0..15). */
function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const btn =
    "flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-base leading-none disabled:opacity-40";
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="scade"
        className={btn}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="w-6 text-center tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="crește"
        className={btn}
        disabled={value >= 15}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

function GenerateTab({
  onSendToEditor,
}: {
  onSendToEditor?: (text: string) => void;
}) {
  const [clasa, setClasa] = useState("VII");
  const groups = useMemo(() => classGroups(clasa), [clasa]);
  const [tema, setTema] = useState("");
  const [counts, setCounts] =
    useState<Record<ItemTypeKey, number>>(DEFAULT_COUNTS);
  const [diff, setDiff] = useState<Difficulty>("mediu");
  const [answers, setAnswers] = useState(false);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [note, setNote] = useState("");
  // Istoricul trimis modelului (pt continuare) + flag „ultimul raspuns a fost taiat
  // la limita de tokeni" (acelasi pattern ca ChatPanel.tsx — un test lung, 10 itemi
  // + barem, poate atinge 8192 tok si s-ar taia MUT fara asta).
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [truncated, setTruncated] = useState(false);

  const effectiveTema = tema || groups[0] || "diverse";
  const total = ITEM_TYPES.reduce((s, t) => s + (counts[t.key] || 0), 0);

  const setCount = (key: ItemTypeKey, n: number) =>
    setCounts((c) => ({ ...c, [key]: Math.max(0, Math.min(15, n)) }));

  const generate = async () => {
    setStatus("loading");
    setNote("Generez testul…");
    setTruncated(false);
    const typeCounts = ITEM_TYPES.map((t) => ({
      key: t.key,
      n: counts[t.key] || 0,
    })).filter((x) => x.n > 0);
    const prompt = buildGeneratePrompt(
      clasa,
      effectiveTema,
      diff,
      answers,
      typeCounts,
    );
    const initial: ChatMessage[] = [{ role: "user", content: prompt }];
    const r = await sendChat(initial, buildSystemPrompt());
    if (r.ok) {
      setResult(r.reply);
      setStatus("idle");
      setNote(`Generat cu ${r.provider}.`);
      setTruncated(r.truncated);
      setHistory([...initial, { role: "assistant", content: r.reply }]);
    } else {
      setStatus("error");
      setNote(r.error);
    }
  };

  const continueGenerate = async () => {
    setStatus("loading");
    setNote("Continui testul…");
    const nextHistory: ChatMessage[] = [
      ...history,
      { role: "user", content: CONTINUE_PROMPT },
    ];
    const r = await sendChat(nextHistory, buildSystemPrompt());
    if (r.ok) {
      setResult((prev) => prev + "\n" + r.reply);
      setStatus("idle");
      setNote(`Continuat cu ${r.provider}.`);
      setTruncated(r.truncated);
      setHistory([...nextHistory, { role: "assistant", content: r.reply }]);
    } else {
      setStatus("error");
      setNote(r.error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          Clasa
          <select
            value={clasa}
            onChange={(e) => {
              setClasa(e.target.value);
              setTema("");
            }}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-xs">
          Temă
          <select
            value={effectiveTema}
            onChange={(e) => setTema(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {groups.length === 0 && <option value="diverse">diverse</option>}
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="rounded-md border border-border p-2">
        <legend className="px-1 text-xs text-muted-foreground">
          Tipuri de item — alege câți din fiecare
        </legend>
        <div className="flex flex-col gap-1.5">
          {ITEM_TYPES.map((t) => (
            <div
              key={t.key}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{t.label}</span>
              <Stepper
                value={counts[t.key] || 0}
                onChange={(n) => setCount(t.key, n)}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-xs font-medium">
          Total: {total} {total === 1 ? "item" : "itemi"}
        </p>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">Dificultate:</span>
        {DIFFICULTIES.map((d) => (
          <label key={d} className="flex items-center gap-1">
            <input
              type="radio"
              name="diff"
              checked={diff === d}
              onChange={() => setDiff(d)}
            />
            {d}
          </label>
        ))}
        <label className="ml-auto flex items-center gap-1">
          <input
            type="checkbox"
            checked={answers}
            onChange={(e) => setAnswers(e.target.checked)}
          />
          cu barem
        </label>
      </div>
      <Button
        type="button"
        size="sm"
        className="h-9"
        onClick={generate}
        disabled={status === "loading" || total === 0}
      >
        {status === "loading"
          ? "Generez…"
          : total === 0
            ? "Alege cel puțin un tip de item"
            : "Generează testul"}
      </Button>
      {note && (
        <p
          className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {note}
        </p>
      )}
      {result && (
        <>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="min-h-[160px] resize-y rounded-md border border-border bg-background p-2 font-mono text-xs"
            aria-label="Test generat (editabil)"
          />
          <div
            className="rounded-md border border-dashed border-border bg-white p-3 text-sm text-black"
            aria-label="Previzualizare test"
            dangerouslySetInnerHTML={{ __html: renderMathText(result) }}
          />
          {truncated && status !== "loading" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 self-start text-xs"
              onClick={continueGenerate}
            >
              Continuă răspunsul ▸
            </Button>
          )}
          {onSendToEditor && (
            <Button
              type="button"
              size="sm"
              className="h-9"
              onClick={() => onSendToEditor(result)}
            >
              Trimite testul în Editor
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────── Corectează ──────────────────────────────── */

type OcrSectionLite = {
  content?: string;
  caption?: string;
  rows?: string[][];
  left?: OcrSectionLite[];
  right?: OcrSectionLite[];
};
function sectionText(s: OcrSectionLite): string {
  const parts: string[] = [];
  if (s.content) parts.push(s.content);
  if (s.caption) parts.push(s.caption);
  if (s.rows) parts.push(s.rows.map((r) => r.join(" | ")).join("\n"));
  (s.left || []).forEach((x) => parts.push(sectionText(x)));
  (s.right || []).forEach((x) => parts.push(sectionText(x)));
  return parts.filter(Boolean).join("\n");
}

function CorrectTab({
  onSendToEditor,
}: {
  onSendToEditor?: (text: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [note, setNote] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [truncated, setTruncated] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setNote("Atașează o POZĂ (jpg/png) a lucrării.");
      return;
    }
    setStatus("loading");
    setNote("Citesc lucrarea (OCR)…");
    setResult("");
    try {
      const blob = await ensureImageUnderCap(file);
      const fd = new FormData();
      fd.append("source_lang", "ro");
      fd.append("engine", "gemini");
      fd.append("files", blob, file.name || "lucrare.jpg");
      const res = await fetch(`${API_URL}/api/ocr`, {
        method: "POST",
        body: fd,
      });
      if (res.status === 413) throw new Error("Poza e prea mare.");
      if (!res.ok) throw new Error(`OCR HTTP ${res.status}`);
      const data = (await res.json()) as {
        structured_pages?: { title?: string; sections?: OcrSectionLite[] }[];
      };
      const text = (data.structured_pages || [])
        .map((p) =>
          [p.title, ...(p.sections || []).map(sectionText)]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n")
        .trim();
      if (!text) throw new Error("N-am putut extrage text din imagine.");
      setNote("Corectez…");
      const initial: ChatMessage[] = [
        { role: "user", content: buildCorrectPrompt(text) },
      ];
      const r = await sendChat(initial, buildSystemPrompt());
      if (r.ok) {
        setResult(r.reply);
        setStatus("idle");
        setNote(`Corectat cu ${r.provider}.`);
        setTruncated(r.truncated);
        setHistory([...initial, { role: "assistant", content: r.reply }]);
      } else {
        setStatus("error");
        setNote(r.error);
      }
    } catch (e) {
      setStatus("error");
      setNote((e as Error).message || "Eroare");
    }
  };

  const continueCorrect = async () => {
    setStatus("loading");
    setNote("Continui corectarea…");
    const nextHistory: ChatMessage[] = [
      ...history,
      { role: "user", content: CONTINUE_PROMPT },
    ];
    const r = await sendChat(nextHistory, buildSystemPrompt());
    if (r.ok) {
      setResult((prev) => prev + "\n" + r.reply);
      setStatus("idle");
      setNote(`Continuat cu ${r.provider}.`);
      setTruncated(r.truncated);
      setHistory([...nextHistory, { role: "assistant", content: r.reply }]);
    } else {
      setStatus("error");
      setNote(r.error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-muted-foreground">
        Atașează o poză a lucrării rezolvate → o citesc (OCR) și îți spun unde e
        greșit + o notă orientativă.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        size="sm"
        className="h-9"
        onClick={() => fileRef.current?.click()}
        disabled={status === "loading"}
      >
        📎 Atașează poza lucrării
      </Button>
      {note && (
        <p
          className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {note}
        </p>
      )}
      {result && (
        <>
          <div
            className="rounded-md border border-dashed border-border bg-white p-3 text-sm text-black"
            aria-label="Corectură"
            dangerouslySetInnerHTML={{ __html: renderMathText(result) }}
          />
          {truncated && status !== "loading" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 self-start text-xs"
              onClick={continueCorrect}
            >
              Continuă răspunsul ▸
            </Button>
          )}
          {onSendToEditor && (
            <Button
              type="button"
              size="sm"
              className="h-9"
              onClick={() => onSendToEditor(result)}
            >
              ➕ Trimite corectarea în Editor
            </Button>
          )}
        </>
      )}
    </div>
  );
}
