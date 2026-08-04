"use client";

import { useEffect, useRef, useState } from "react";
import katex from "katex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendChat, CHAIN, type ChatMessage } from "@/lib/chat-providers";
import { buildSystemPrompt } from "@/lib/chat-context";
import { ensureImageUnderCap } from "@/lib/image-downscale";
import { API_URL } from "@/lib/api-url";

/**
 * Chat AI matematică (2026-08-04, mock §17 aprobat) — înlocuiește Asistentul.
 * Lanț Gemini→Groq→OpenRouter (prin `/api/proxy`), indicator de stare per provider,
 * răspunsuri randate KaTeX, cunoașterea aplicației (system-prompt) și atașare de
 * imagini cu OCR (pozezi tema → analiză/corectare). Temă verde (tablă+cretă).
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Text cu $...$ / $$...$$ → HTML cu KaTeX (restul escape-uit; \n → <br>). */
function renderMathText(text: string): string {
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const plain = (t: string) => escapeHtml(t).replace(/\n/g, "<br>");
  while ((m = re.exec(text)) !== null) {
    out.push(plain(text.slice(last, m.index)));
    const tex = m[1] ?? m[2] ?? "";
    try {
      out.push(
        katex.renderToString(tex, {
          throwOnError: false,
          strict: false,
          displayMode: m[1] != null,
        }),
      );
    } catch {
      out.push(escapeHtml(m[0]));
    }
    last = re.lastIndex;
  }
  out.push(plain(text.slice(last)));
  return out.join("");
}

type OcrSectionLite = {
  content?: string;
  caption?: string;
  rows?: string[][];
  left?: OcrSectionLite[];
  right?: OcrSectionLite[];
};
type OcrPageLite = { title?: string; sections?: OcrSectionLite[] };

function sectionText(s: OcrSectionLite): string {
  const parts: string[] = [];
  if (s.content) parts.push(s.content);
  if (s.caption) parts.push(s.caption);
  if (s.rows) parts.push(s.rows.map((r) => r.join(" | ")).join("\n"));
  (s.left || []).forEach((x) => parts.push(sectionText(x)));
  (s.right || []).forEach((x) => parts.push(sectionText(x)));
  return parts.filter(Boolean).join("\n");
}
function pagesToText(pages: OcrPageLite[]): string {
  return pages
    .map((p) =>
      [p.title, ...(p.sections || []).map(sectionText)]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
    .trim();
}

type Status = "idle" | "loading" | "ok" | "error";

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [provider, setProvider] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);

  const ask = async (history: ChatMessage[]) => {
    setStatus("loading");
    setNote("");
    const r = await sendChat(history, buildSystemPrompt());
    if (r.ok) {
      setProvider(r.provider);
      setStatus("ok");
      setMessages([...history, { role: "assistant", content: r.reply }]);
    } else {
      setStatus("error");
      setNote(r.error);
    }
  };

  const send = () => {
    const t = input.trim();
    if (!t || status === "loading") return;
    const next: ChatMessage[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    ask(next);
  };

  const testAI = () => {
    if (status === "loading") return;
    ask([
      {
        role: "user",
        content: "Salut! Confirmă într-o propoziție că funcționezi.",
      },
    ]);
  };

  const onAttach = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setNote(
        "Atașează o POZĂ (jpg/png) a temei — PDF-urile se importă din Editor.",
      );
      return;
    }
    setStatus("loading");
    setNote("Citesc imaginea (OCR)…");
    try {
      const blob = await ensureImageUnderCap(file);
      const fd = new FormData();
      fd.append("source_lang", "ro");
      fd.append("engine", "gemini");
      fd.append("files", blob, file.name || "poza.jpg");
      const res = await fetch(`${API_URL}/api/ocr`, {
        method: "POST",
        body: fd,
      });
      if (res.status === 413) throw new Error("Poza e prea mare.");
      if (!res.ok) throw new Error(`OCR HTTP ${res.status}`);
      const data = (await res.json()) as { structured_pages?: OcrPageLite[] };
      const extracted = pagesToText(data.structured_pages || []);
      setStatus("idle");
      setNote("");
      if (!extracted) {
        setNote("N-am putut extrage text din imagine.");
        return;
      }
      setInput(`Verifică și corectează această rezolvare:\n${extracted}`);
    } catch (e) {
      setStatus("error");
      setNote((e as Error).message || "Eroare la citirea imaginii");
    }
  };

  const dotColor =
    status === "ok"
      ? "bg-green-500"
      : status === "error"
        ? "bg-red-500"
        : status === "loading"
          ? "bg-amber-400 animate-pulse"
          : "bg-muted-foreground/40";

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      {/* Indicator de stare providers */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} aria-hidden />
        <span className="font-medium">
          {status === "loading"
            ? "AI gândește…"
            : provider
              ? `Model activ: ${provider}`
              : "Asistent Matematică AI"}
        </span>
        <span className="ml-auto hidden text-muted-foreground sm:inline">
          {CHAIN.map((c) => c.label).join(" → ")}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={testAI}
        >
          Testează
        </Button>
      </div>

      {/* Mesaje */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Întreabă orice de matematică, sau atașează o poză a temei ca s-o
            corectez. Ex.: „Rezolvă ecuația 2x+3=11" sau „Cât e ∫ x² dx?".
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-chalk-yellow/20"
                  : "border border-border bg-white text-black"
              }`}
              dangerouslySetInnerHTML={{ __html: renderMathText(m.content) }}
            />
          </div>
        ))}
        {note && (
          <p className="text-center text-xs text-muted-foreground">{note}</p>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAttach(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0"
          title="Atașează o poză (OCR)"
          onClick={() => fileRef.current?.click()}
        >
          📎
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Scrie o întrebare de matematică…"
          className="h-9"
          aria-label="Mesaj"
        />
        <Button
          type="button"
          size="sm"
          className="h-9 shrink-0"
          onClick={send}
          disabled={status === "loading"}
        >
          Trimite
        </Button>
      </div>
    </div>
  );
}
