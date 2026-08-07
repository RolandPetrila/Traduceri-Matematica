"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { sendChat, type ChatMessage } from "@/lib/chat-providers";
import { renderMathText } from "@/lib/math-html";
import {
  CURRICULUM,
  getCycle,
  getLevel,
  getNode,
} from "@/lib/scolare/curriculum";
import {
  buildScolarePrompt,
  buildScolareSystemPrompt,
  DIFICULTATI,
  type Dificultate,
} from "@/lib/scolare/prompt";
import {
  avoidList,
  bucketKey,
  extractStems,
  isDuplicate,
  record,
  signature,
} from "@/lib/scolare/history";
import { verifyArithmetic, type VerifyResult } from "@/lib/scolare/verify-fisa";

/**
 * Modul „Școlare 🌐" (F0, 2026-08-07) — generator AI de fișe curriculare A4.
 * Selectezi ciclu → clasă → materie/domeniu → dificultate → AI generează fișa din
 * skeleton + regulament, cu anti-repetare (re-roll la duplicat) + strat de verificare
 * aritmetică. Reutilizează lanțul AI (chat-providers) + randarea math + puntea „în
 * editor". Vezi docs/PLAN_SCOLARE_2026-08-07.md. Temă cretă.
 */

const NR_OPTIONS = [3, 4, 5, 6, 8];
const CONTINUE_PROMPT =
  "Continuă exact de unde ai rămas, fără să reiei ce ai scris deja.";

/** „gimnaziu/clasa-5/matematica" → „gimnaziu_clasa5_matematica.md". */
function refToFile(ref: string): string {
  return ref.replace(/\//g, "_").replace(/clasa-/g, "clasa") + ".md";
}

const regCache: Record<string, string> = {};
async function loadRegulament(ref?: string): Promise<string | undefined> {
  if (!ref) return undefined;
  if (regCache[ref] !== undefined) return regCache[ref];
  try {
    const res = await fetch(`/scolare/regulamente/${refToFile(ref)}`);
    if (!res.ok) return undefined;
    const text = await res.text();
    regCache[ref] = text;
    return text;
  } catch {
    return undefined;
  }
}

export function ScolarePanel({
  onSendToEditor,
}: {
  onSendToEditor?: (text: string) => void;
}) {
  const [cycleId, setCycleId] = useState("gimnaziu");
  const cycle = getCycle(cycleId)!;
  const [levelId, setLevelId] = useState("clasa-5");
  const level = useMemo(
    () => getLevel(cycleId, levelId) ?? cycle.nivele[0],
    [cycleId, levelId, cycle],
  );
  const [nodeId, setNodeId] = useState("matematica");
  const node = useMemo(
    () => getNode(cycleId, level.id, nodeId) ?? level.noduri[0],
    [cycleId, level, nodeId],
  );

  const [dificultate, setDificultate] = useState<Dificultate>("Standard");
  const [nrEx, setNrEx] = useState(5);
  const [cerinta, setCerinta] = useState("");

  const [result, setResult] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [note, setNote] = useState("");
  const [verify, setVerify] = useState<VerifyResult | null>(null);

  // La schimbarea ciclului/nivelului, resetează selecțiile dependente la primul valid.
  const onCycle = (id: string) => {
    setCycleId(id);
    const c = getCycle(id)!;
    setLevelId(c.nivele[0].id);
    setNodeId(c.nivele[0].noduri[0].id);
  };
  const onLevel = (id: string) => {
    setLevelId(id);
    const l = getLevel(cycleId, id)!;
    setNodeId(l.noduri[0].id);
  };

  const generate = async () => {
    setStatus("loading");
    setNote("Generez fișa…");
    setTruncated(false);
    setVerify(null);
    const bucket = bucketKey(cycleId, level.id, node.id);
    const regulament = await loadRegulament(node.regulament_ref);
    let avoid = avoidList(bucket);

    // Re-roll anti-repetare: dacă fișa generată are semnătură deja folosită, reîncearcă
    // cu enunțurile ei adăugate la lista de evitat (max 3 încercări).
    for (let attempt = 0; attempt < 3; attempt++) {
      const prompt = buildScolarePrompt({
        cycle,
        level,
        node,
        regulament,
        dificultate,
        cerintaSpecifica: cerinta,
        avoid,
        nrExercitii: nrEx,
      });
      const initial: ChatMessage[] = [{ role: "user", content: prompt }];
      const r = await sendChat(initial, buildScolareSystemPrompt());
      if (!r.ok) {
        setStatus("error");
        setNote(r.error);
        return;
      }
      const sig = signature(r.reply);
      if (isDuplicate(bucket, sig) && attempt < 2) {
        avoid = [...avoid, ...extractStems(r.reply)];
        setNote("Fișă deja generată — reîncerc cu alta…");
        continue;
      }
      record(bucket, sig, extractStems(r.reply));
      setResult(r.reply);
      setHistory([...initial, { role: "assistant", content: r.reply }]);
      setTruncated(r.truncated);
      setVerify(verifyArithmetic(r.reply));
      setStatus("idle");
      setNote(`Generat cu ${r.provider}.`);
      return;
    }
  };

  const continueGenerate = async () => {
    setStatus("loading");
    setNote("Continui fișa…");
    const next: ChatMessage[] = [
      ...history,
      { role: "user", content: CONTINUE_PROMPT },
    ];
    const r = await sendChat(next, buildScolareSystemPrompt());
    if (r.ok) {
      const merged = result + "\n" + r.reply;
      setResult(merged);
      setHistory([...next, { role: "assistant", content: r.reply }]);
      setTruncated(r.truncated);
      setVerify(verifyArithmetic(merged));
      setStatus("idle");
      setNote(`Continuat cu ${r.provider}.`);
    } else {
      setStatus("error");
      setNote(r.error);
    }
  };

  const selectCls =
    "h-9 rounded-md border border-chalk-white/25 bg-black/20 px-2 text-sm text-chalk-white";

  return (
    <div className="chalk-text w-full rounded-lg border border-chalk-white/20 bg-chalkboard p-3">
      {/* Print-izolat: la tipărire se vede DOAR fișa (.scolare-print-area). */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .scolare-print-area, .scolare-print-area * { visibility: visible !important; }
          .scolare-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 12mm; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <h2 className="mb-2 text-lg font-semibold text-chalk-yellow">
        Școlare 🌐
      </h2>
      <p className="mb-3 text-xs text-chalk-white/70">
        Fișe de lucru pe programa școlară RO, generate cu AI (online, câteva
        secunde). Verifică-le înainte de tipărire.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-chalk-white/80">
          Ciclu
          <select
            value={cycleId}
            onChange={(e) => onCycle(e.target.value)}
            className={selectCls}
          >
            {CURRICULUM.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nume}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-chalk-white/80">
          {level.tip === "domeniu" ? "Grupă" : "Clasa"}
          <select
            value={level.id}
            onChange={(e) => onLevel(e.target.value)}
            className={selectCls}
          >
            {cycle.nivele.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nume}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-chalk-white/80">
          {level.tip === "domeniu" ? "Domeniu" : "Materie"}
          <select
            value={node.id}
            onChange={(e) => setNodeId(e.target.value)}
            className={selectCls}
          >
            {level.noduri.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nume}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-chalk-white/80">
          Exerciții
          <select
            value={nrEx}
            onChange={(e) => setNrEx(Number(e.target.value))}
            className={selectCls}
          >
            {NR_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-chalk-white/70">Dificultate:</span>
        {DIFICULTATI.map((d) => (
          <label key={d} className="flex items-center gap-1 text-chalk-white">
            <input
              type="radio"
              name="scolare-dif"
              checked={dificultate === d}
              onChange={() => setDificultate(d)}
            />
            {d}
          </label>
        ))}
      </div>

      <label className="mt-2 flex flex-col gap-1 text-xs text-chalk-white/80">
        Cerință specifică (opțional)
        <input
          type="text"
          value={cerinta}
          onChange={(e) => setCerinta(e.target.value)}
          placeholder="ex. doar exerciții cu puteri; temă despre toamnă…"
          className="h-9 rounded-md border border-chalk-white/25 bg-black/20 px-2 text-sm text-chalk-white placeholder:text-chalk-white/40"
        />
      </label>

      {node.in_reforma && (
        <p className="mt-2 rounded-md border border-chalk-yellow/40 bg-chalk-yellow/10 p-2 text-xs text-chalk-yellow">
          ⚠ Programă în reformă curriculară (2026-2027) — verifică alinierea la
          programa oficială curentă (rocnee.eu).
        </p>
      )}

      <Button
        type="button"
        size="sm"
        className="mt-3 h-9"
        onClick={generate}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Generez…" : "Generează fișa"}
      </Button>

      {note && (
        <p
          className={`mt-2 text-xs ${status === "error" ? "text-red-300" : "text-chalk-white/70"}`}
        >
          {note}
        </p>
      )}

      {result && (
        <div className="mt-3 flex flex-col gap-2">
          {/* Banner de verificare — MEREU prezent (fișele AI nu au garanție). */}
          <div
            className={`rounded-md border p-2 text-xs ${
              verify && verify.issues.length
                ? "border-red-400/60 bg-red-500/10 text-red-200"
                : "border-chalk-yellow/40 bg-chalk-yellow/10 text-chalk-yellow"
            }`}
          >
            {verify && verify.issues.length > 0 ? (
              <>
                ⚠ Am găsit {verify.issues.length} posibil(e) greșeli aritmetice
                — <strong>verifică înainte de tipărire</strong>:
                <ul className="ml-4 mt-1 list-disc">
                  {verify.issues.slice(0, 6).map((i, k) => (
                    <li key={k}>
                      <code>{i.expr}</code> (corect: {i.expected})
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                ⚠ Fișă generată de AI. Am verificat {verify?.checked ?? 0}{" "}
                egalități aritmetice (fără erori detectate), dar{" "}
                <strong>verifică întotdeauna înainte de tipărire</strong> —
                problemele cu enunț liber nu pot fi verificate automat.
              </>
            )}
          </div>

          {/* Previzualizare A4 (alb/negru pt tipărire) — zona care se printează. */}
          <div className="scolare-print-area rounded-md border border-dashed border-chalk-white/30 bg-white p-4 text-sm text-black">
            <div dangerouslySetInnerHTML={{ __html: renderMathText(result) }} />
          </div>

          <div className="flex flex-wrap gap-2">
            {truncated && status !== "loading" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={continueGenerate}
              >
                Continuă răspunsul ▸
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="h-9"
              onClick={() => window.print()}
            >
              🖨 Printează / PDF
            </Button>
            {onSendToEditor && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => onSendToEditor(result)}
              >
                ➕ În editor
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
