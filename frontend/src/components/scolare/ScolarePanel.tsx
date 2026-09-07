"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  sendChat,
  GENERATION_OPTS,
  type ChatMessage,
} from "@/lib/chat-providers";
import { renderScolareContent } from "@/lib/scolare/drawing/parse-render";
import {
  CURRICULUM,
  describeGroundedCoverage,
  getCycle,
  getLevel,
  getNode,
} from "@/lib/scolare/curriculum";
import { refToFile } from "@/lib/scolare/ref";
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
import { sanitizeFisa } from "@/lib/scolare/sanitize";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { reportFailure } from "@/lib/failure";

/**
 * Modul „Școlare 🌐" (F0, 2026-08-07) — generator AI de fișe curriculare A4.
 * Selectezi ciclu → clasă → materie/domeniu → dificultate → AI generează fișa din
 * skeleton + regulament, cu anti-repetare (re-roll la duplicat) + strat de verificare
 * aritmetică. Reutilizează lanțul AI (chat-providers) + randarea math + puntea „în
 * editor". Vezi docs/PLAN_SCOLARE_2026-08-07.md. Temă cretă.
 */

// Ridicat de la max 8 → max 20 (2026-08-20). Măsurat (token_probe.mjs): 20 exerciții
// + barem complet = ~4000 tokeni / ~35s (finish=STOP), încap într-o generare; peste
// asta intervine auto-continuarea (baremul ajunge mereu). „Maximul AI-ului" e mărginit
// de plafonul 60s al proxy-ului, nu de tokeni — 20 e pragul sigur pt o singură rulare.
const NR_OPTIONS = [4, 6, 8, 10, 12, 15, 20];
const CONTINUE_PROMPT =
  "Continuă exact de unde ai rămas, fără să reiei ce ai scris deja.";

// Acoperirea ghidată, derivată LIVE din skeleton (nu hardcodată) — vezi trap 2, advisor F3.
const GROUNDED_COVERAGE = describeGroundedCoverage();

// Cache DOAR succesele — un eșec tranzitoriu (ex. cold edge-cache imediat
// după deploy) nu mai rămâne blocat permanent pt restul sesiunii tab-ului
// (bug găsit la code review: eșecul se cache-uia ca "" definitiv, fără
// retry, fără semnal vizibil pt utilizator). `hasOwnProperty` în loc de
// `in` — `in` verifică și proprietățile moștenite din Object.prototype
// (ex. dacă un regulament_ref ar fi vreodată "constructor", `in` ar
// întoarce true fals-pozitiv înainte de orice fetch real).
const regCache: Record<string, string> = {};
async function loadRegulament(ref?: string): Promise<string | undefined> {
  if (!ref) return undefined;
  if (Object.prototype.hasOwnProperty.call(regCache, ref))
    return regCache[ref] || undefined;
  try {
    const res = await fetchWithRetry(
      `/scolare/regulamente/${refToFile(ref)}`,
      {},
    );
    const text = res.ok ? await res.text() : "";
    if (text) regCache[ref] = text;
    return text || undefined;
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
  // Fallback defensiv: un cycleId invalid (stare inconsistentă) degradează la primul
  // ciclu, nu crapă componenta (`getCycle` poate întoarce undefined).
  const cycle = getCycle(cycleId) ?? CURRICULUM[0];
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

  // „Ghidat curricular" = nodul are un regulament propriu (concepte/interdicții).
  // Din 2026-08-08 toate cele 112 noduri din skeleton (Grădiniță/Primar/Gimnaziu/
  // Liceu) au regulament_ref — practic mereu true azi, dar rămâne calculat din
  // date (nu hardcodat) ca gardă onestă dacă un nod nou e adăugat fără regulament.
  const grounded = !!node.regulament_ref;

  const [dificultate, setDificultate] = useState<Dificultate>("Standard");
  const [nrEx, setNrEx] = useState(5);
  const [cerinta, setCerinta] = useState("");
  // Capitole (teme) selectate din programa nodului. Gol = TOATE (comportament vechi).
  // Când Cristina bifează unele → generarea acoperă exact acele teme.
  const [selectedCapitole, setSelectedCapitole] = useState<string[]>([]);

  const [result, setResult] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [note, setNote] = useState("");
  const [verify, setVerify] = useState<VerifyResult | null>(null);

  // La schimbarea ciclului/nivelului, resetează selecțiile dependente la primul valid.
  const onCycle = (id: string) => {
    const c = getCycle(id);
    if (!c) return;
    setCycleId(id);
    setLevelId(c.nivele[0].id);
    setNodeId(c.nivele[0].noduri[0].id);
    setSelectedCapitole([]); // capitolele depind de nod → resetăm la schimbare
  };
  const onLevel = (id: string) => {
    const l = getLevel(cycleId, id);
    if (!l) return;
    setLevelId(id);
    setNodeId(l.noduri[0].id);
    setSelectedCapitole([]);
  };
  const onNode = (id: string) => {
    setNodeId(id);
    setSelectedCapitole([]);
  };

  const generate = async () => {
    setStatus("loading");
    setNote("Generez fișa…");
    setTruncated(false);
    setVerify(null);
    const bucket = bucketKey(cycleId, level.id, node.id);
    const regulament = await loadRegulament(node.regulament_ref);
    // R4 (audit 2026-09-07): dacă nodul ARE regulament dar fetch-ul a eșuat (rețea/404),
    // generarea continuă NE-ghidat — semnalăm vizibil (bannerul static din UI arăta „ghidat"
    // pe baza existenței `regulament_ref`, nu a încărcării reale → inducea în eroare).
    const regExpectedButMissing = !!node.regulament_ref && !regulament;
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
        capitole: selectedCapitole,
      });
      const initial: ChatMessage[] = [{ role: "user", content: prompt }];
      const r = await sendChat(
        initial,
        buildScolareSystemPrompt(cycle, level),
        GENERATION_OPTS,
      );
      if (!r.ok) {
        setStatus("error");
        setNote(
          reportFailure({
            code: "E-SCOL-001",
            flow: "scolare.generate",
            error: new Error(r.error),
            context: {
              node: node.id,
              level: level.id,
              cycle: cycleId,
              nrEx,
              dificultate,
              regulamentLoaded: !!regulament,
              attempt,
              errors: r.errors,
            },
            userHint: r.error,
          }).userMessage,
        );
        return;
      }
      // Sanitizează runaway-urile de „linii de completat" ÎNAINTE de orice consum
      // (dedup, randare, verificare, editor) — vezi lib/scolare/sanitize.ts (proba LIVE F3).
      const reply = sanitizeFisa(r.reply);
      const sig = signature(reply);
      if (isDuplicate(bucket, sig) && attempt < 2) {
        avoid = [...avoid, ...extractStems(reply)];
        setNote("Fișă deja generată — reîncerc cu alta…");
        continue;
      }
      // Auto-continuare: baremul e la FINALUL fișei — dacă răspunsul s-a truncat,
      // completăm automat (max 2 runde) ca fișa (inclusiv cheia de răspunsuri) să
      // ajungă completă = validă pt tipărire la elevi, fără click manual „Continuă".
      let fullReply = reply;
      let msgs: ChatMessage[] = [
        ...initial,
        { role: "assistant", content: reply },
      ];
      let wasTruncated = r.truncated;
      let provider = r.provider;
      let contFailed = false;
      for (let round = 0; wasTruncated && round < 2; round++) {
        setNote(`Completez fișa (partea ${round + 2})…`);
        const cont = await sendChat(
          [...msgs, { role: "user", content: CONTINUE_PROMPT }],
          buildScolareSystemPrompt(cycle, level),
          GENERATION_OPTS,
        );
        if (!cont.ok) {
          contFailed = true;
          break;
        }
        fullReply = sanitizeFisa(fullReply + "\n" + cont.reply);
        msgs = [
          ...msgs,
          { role: "user", content: CONTINUE_PROMPT },
          { role: "assistant", content: sanitizeFisa(cont.reply) },
        ];
        wasTruncated = cont.truncated;
        provider = cont.provider;
      }
      record(bucket, signature(fullReply), extractStems(fullReply));
      setResult(fullReply);
      setHistory(msgs);
      setTruncated(wasTruncated);
      setVerify(verifyArithmetic(fullReply));
      setStatus("idle");
      // Notă onestă: barem complet DOAR dacă nu mai e truncat ȘI nicio rundă n-a eșuat
      // (același bug ca la Teste #2 — nu raporta succes fals). + avertisment regulament (R4).
      if (contFailed || wasTruncated) {
        setNote(
          "⚠ Fișa poate fi INCOMPLETĂ (baremul s-a putut trunchia). Apasă „Continuă răspunsul” pentru restul.",
        );
      } else if (regExpectedButMissing) {
        setNote(
          `Generat cu ${provider}. ⚠ Regulamentul curricular nu s-a putut încărca — fișa e mai puțin ghidată; reîncearcă dacă pare în afara programei.`,
        );
      } else {
        setNote(`Generat cu ${provider}.`);
      }
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
    const r = await sendChat(
      next,
      buildScolareSystemPrompt(cycle, level),
      GENERATION_OPTS,
    );
    if (r.ok) {
      const merged = sanitizeFisa(result + "\n" + r.reply);
      // Bug găsit la code review: continueGenerate() nu apela record(), deci
      // enunțurile care existau DOAR în coada unei continuări nu intrau
      // niciodată în istoricul anti-repetare — generate() le putea reda la
      // o generare ulterioară pt aceeași clasă+materie, fără avertisment.
      record(
        bucketKey(cycleId, level.id, node.id),
        signature(merged),
        extractStems(merged),
      );
      setResult(merged);
      setHistory([
        ...next,
        { role: "assistant", content: sanitizeFisa(r.reply) },
      ]);
      setTruncated(r.truncated);
      setVerify(verifyArithmetic(merged));
      setStatus("idle");
      setNote(`Continuat cu ${r.provider}.`);
    } else {
      setStatus("error");
      setNote(
        reportFailure({
          code: "E-SCOL-001",
          flow: "scolare.generate.continue",
          error: new Error(r.error),
          context: {
            node: node.id,
            level: level.id,
            cycle: cycleId,
            turns: history.length,
            errors: r.errors,
          },
          userHint: r.error,
        }).userMessage,
      );
    }
  };

  const selectCls =
    "h-9 rounded-md border border-chalk-white/25 bg-black/20 px-2 text-sm text-chalk-white";

  return (
    <div className="chalk-text w-full rounded-lg border border-chalk-white/20 bg-chalkboard p-3">
      {/* Print-izolat: la tipărire se vede DOAR fișa (.scolare-print-area). */}
      <style>{`
        @media print {
          html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          .scolare-print-area, .scolare-print-area * { visibility: visible !important; }
          .scolare-print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0; padding: 12mm; border: 0 !important; background: #fff !important;
            color: #000 !important; box-shadow: none !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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
            disabled={status === "loading"}
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
            disabled={status === "loading"}
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
            onChange={(e) => onNode(e.target.value)}
            className={selectCls}
            disabled={status === "loading"}
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
            disabled={status === "loading"}
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
              disabled={status === "loading"}
              onChange={() => setDificultate(d)}
            />
            {d}
          </label>
        ))}
      </div>

      {node.capitole && node.capitole.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 text-xs text-chalk-white/80">
          <span>
            Teme din programă{" "}
            <span className="text-chalk-white/50">
              (bifează exact ce vrei să genereze; gol = toate cele{" "}
              {node.capitole.length})
            </span>
          </span>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-chalk-white/20 bg-black/20 p-2">
            {node.capitole.map((cap) => {
              const on = selectedCapitole.includes(cap);
              return (
                <label
                  key={cap}
                  className="flex cursor-pointer items-start gap-2 text-chalk-white"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={status === "loading"}
                    onChange={() =>
                      setSelectedCapitole((prev) =>
                        on ? prev.filter((c) => c !== cap) : [...prev, cap],
                      )
                    }
                    className="mt-0.5"
                  />
                  <span>{cap}</span>
                </label>
              );
            })}
          </div>
          {selectedCapitole.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCapitole([])}
              disabled={status === "loading"}
              className="self-start text-chalk-yellow/80 underline disabled:opacity-50"
            >
              Deselectează tot ({selectedCapitole.length} bifate → folosește
              toate temele)
            </button>
          )}
        </div>
      )}

      <label className="mt-2 flex flex-col gap-1 text-xs text-chalk-white/80">
        Cerință specifică (opțional)
        <input
          type="text"
          value={cerinta}
          disabled={status === "loading"}
          onChange={(e) => setCerinta(e.target.value)}
          placeholder="ex. doar exerciții cu puteri; temă despre toamnă…"
          className="h-9 rounded-md border border-chalk-white/25 bg-black/20 px-2 text-sm text-chalk-white placeholder:text-chalk-white/40 disabled:opacity-50"
        />
      </label>

      {node.in_reforma && (
        <p className="mt-2 rounded-md border border-chalk-yellow/40 bg-chalk-yellow/10 p-2 text-xs text-chalk-yellow">
          ⚠ Programă în reformă curriculară (2026-2027) — verifică alinierea la
          programa oficială curentă (rocnee.eu).
        </p>
      )}

      {!grounded && (
        <p className="mt-2 rounded-md border border-chalk-blue/40 bg-chalk-blue/10 p-2 text-xs text-chalk-blue">
          ℹ Acest nod are structura completă, dar conținutul nu e încă ghidat de
          un regulament propriu. Momentan sunt ghidate curricular:{" "}
          <strong>{GROUNDED_COVERAGE}</strong>. Fișa generată aici e mai puțin
          precisă curricular — urmează la fazele următoare.
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
          role={status === "error" ? "alert" : "status"}
          aria-live={status === "error" ? "assertive" : "polite"}
          className={`mt-2 text-xs ${status === "error" ? "text-red-300" : "text-chalk-white/70"}`}
        >
          {note}
        </p>
      )}

      {result && (
        <div className="mt-3 flex flex-col gap-2">
          {/* Banner de verificare — MEREU prezent (fișele AI nu au garanție). */}
          <div
            role="status"
            aria-live="polite"
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
            <div
              dangerouslySetInnerHTML={{ __html: renderScolareContent(result) }}
            />
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
