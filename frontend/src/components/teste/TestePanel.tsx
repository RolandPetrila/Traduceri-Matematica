"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendChat } from "@/lib/chat-providers";
import { buildSystemPrompt } from "@/lib/chat-context";
import { renderMathText } from "@/lib/math-html";
import { ensureImageUnderCap } from "@/lib/image-downscale";
import { API_URL } from "@/lib/api-url";
import {
  CLASSES,
  DIFFICULTIES,
  classGroups,
  buildGeneratePrompt,
  buildCorrectPrompt,
  type Difficulty,
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
    <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
      <Tabs defaultValue="genereaza" className="w-full">
        <TabsList className="mb-3 grid w-full grid-cols-2">
          <TabsTrigger value="genereaza">Generează</TabsTrigger>
          <TabsTrigger value="corecteaza">Corectează</TabsTrigger>
        </TabsList>
        <TabsContent value="genereaza">
          <GenerateTab onSendToEditor={onSendToEditor} />
        </TabsContent>
        <TabsContent value="corecteaza">
          <CorrectTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ──────────────────────────────── Generează ──────────────────────────────── */

function GenerateTab({
  onSendToEditor,
}: {
  onSendToEditor?: (text: string) => void;
}) {
  const [clasa, setClasa] = useState("VII");
  const groups = useMemo(() => classGroups(clasa), [clasa]);
  const [tema, setTema] = useState("");
  const [count, setCount] = useState("10");
  const [diff, setDiff] = useState<Difficulty>("mediu");
  const [answers, setAnswers] = useState(false);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [note, setNote] = useState("");

  const effectiveTema = tema || groups[0] || "diverse";

  const generate = async () => {
    setStatus("loading");
    setNote("Generez testul…");
    const prompt = buildGeneratePrompt(
      clasa,
      effectiveTema,
      parseInt(count, 10) || 5,
      diff,
      answers,
    );
    const r = await sendChat(
      [{ role: "user", content: prompt }],
      buildSystemPrompt(),
    );
    if (r.ok) {
      setResult(r.reply);
      setStatus("idle");
      setNote(`Generat cu ${r.provider}.`);
    } else {
      setStatus("error");
      setNote(r.error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
        <label className="col-span-1 flex flex-col gap-1 text-xs sm:col-span-2">
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
        <label className="flex flex-col gap-1 text-xs">
          Nr. itemi
          <Input
            value={count}
            onChange={(e) => setCount(e.target.value)}
            inputMode="numeric"
            className="h-9 text-sm"
          />
        </label>
      </div>
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
        disabled={status === "loading"}
      >
        {status === "loading" ? "Generez…" : "Generează testul"}
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

function CorrectTab() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [note, setNote] = useState("");
  const [result, setResult] = useState("");
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
      const r = await sendChat(
        [{ role: "user", content: buildCorrectPrompt(text) }],
        buildSystemPrompt(),
      );
      if (r.ok) {
        setResult(r.reply);
        setStatus("idle");
        setNote(`Corectat cu ${r.provider}.`);
      } else {
        setStatus("error");
        setNote(r.error);
      }
    } catch (e) {
      setStatus("error");
      setNote((e as Error).message || "Eroare");
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
        <div
          className="rounded-md border border-dashed border-border bg-white p-3 text-sm text-black"
          aria-label="Corectură"
          dangerouslySetInnerHTML={{ __html: renderMathText(result) }}
        />
      )}
    </div>
  );
}
