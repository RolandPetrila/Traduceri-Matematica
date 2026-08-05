/**
 * Generator/corectare TESTE (2026-08-04) — logică PURĂ (fără React), testabilă.
 * Construiește prompt-urile pentru lanțul AI (vezi chat-providers) folosind
 * biblioteca de formule ca sursă de teme pe clasă. Generarea + corectarea rulează
 * prin `sendChat`; aici doar formulăm prompt-ul + normalizăm intrările.
 */
import mathData from "@/components/editor/math-data.json";

type MathData = { formule: Record<string, { grup: string }[]> };

export const CLASSES = [
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;
export type ClassName = (typeof CLASSES)[number];

export const DIFFICULTIES = ["ușor", "mediu", "greu"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Tipurile de item pe care profesorul le poate alege la generare (câte unul poate
 * avea un număr propriu de itemi). `instr` = descrierea de format trimisă în promptul
 * AI, ca testul generat să aibă exact structura cerută.
 */
export const ITEM_TYPES = [
  {
    key: "grila",
    label: "Alegere multiplă",
    instr:
      "de tip alegere multiplă (grilă): enunț urmat de 4 variante etichetate a), b), c), d), din care exact UNA corectă",
  },
  {
    key: "completare",
    label: "Completare",
    instr:
      "de tip completare: enunț cu unul sau două spații lipsă marcate „___” (termen, rezultat sau formulă de completat)",
  },
  {
    key: "probleme",
    label: "Rezolvare de probleme",
    instr:
      "de tip rezolvare de probleme: problemă cu enunț care cere rezolvare pas cu pas",
  },
  {
    key: "adevfals",
    label: "Adevărat / Fals",
    instr:
      "de tip adevărat/fals: o afirmație matematică de evaluat cu A (adevărat) sau F (fals)",
  },
  {
    key: "corespondenta",
    label: "Corespondență",
    instr:
      "de tip corespondență (asociere): două coloane (ex. expresii ↔ rezultate/definiții) de asociat",
  },
] as const;

export type ItemTypeKey = (typeof ITEM_TYPES)[number]["key"];
export type TypeCount = { key: ItemTypeKey; n: number };

const TYPE_BY_KEY: Record<string, (typeof ITEM_TYPES)[number]> =
  Object.fromEntries(ITEM_TYPES.map((t) => [t.key, t]));

const ROMAN_TO_KEY: Record<string, string> = {
  V: "5",
  VI: "6",
  VII: "7",
  VIII: "8",
  IX: "9",
  X: "10",
  XI: "11",
  XII: "12",
};

/** Temele (grupurile) disponibile pentru o clasă, din biblioteca de formule. */
export function classGroups(clasa: string): string[] {
  const key = ROMAN_TO_KEY[clasa] || clasa;
  const items = (mathData as MathData).formule?.[key] || [];
  return Array.from(new Set(items.map((i) => i.grup)));
}

/**
 * Prompt pentru GENERAREA unui test cu tipuri de item alese de profesor.
 * `typeCounts` = câți itemi din fiecare tip (doar cei cu n>0 sunt incluși). Dacă
 * niciunul nu e selectat → fallback la 5 itemi de rezolvare de probleme.
 */
export function buildGeneratePrompt(
  clasa: string,
  tema: string,
  difficulty: Difficulty,
  withAnswers: boolean,
  typeCounts: TypeCount[],
): string {
  const active = (typeCounts || [])
    .map((t) => ({
      t: TYPE_BY_KEY[t.key],
      n: Math.min(15, Math.max(0, Math.floor(t.n) || 0)),
    }))
    .filter((x) => x.t && x.n > 0);
  const items = active.length ? active : [{ t: TYPE_BY_KEY["probleme"], n: 5 }];
  const total = items.reduce((s, x) => s + x.n, 0);
  const lines = [
    `Generează un test de matematică pentru clasa a ${clasa}-a, tema „${tema}", nivel ${difficulty}.`,
    `Testul are exact ${total} ${total === 1 ? "item" : "itemi"}, împărțiți pe tipuri astfel:`,
    ...items.map(
      (x) => `- ${x.n} ${x.n === 1 ? "item" : "itemi"} ${x.t.instr}`,
    ),
    `Grupează itemii pe secțiuni, câte o secțiune per tip, fiecare cu un titlu scurt (ex. „I. Alegere multiplă”). Numerotează itemii continuu de la 1 la ${total} în tot testul.`,
    "Scrie formulele în LaTeX între semne de dolar ($...$). Conținutul să respecte programa românească pentru această clasă.",
    withAnswers
      ? "La final adaugă o secțiune „Barem / Soluții” cu răspunsul fiecărui item (litera corectă la alegere multiplă; termenul la completare; A sau F; perechile la corespondență; rezolvarea la probleme)."
      : "NU include răspunsurile (doar enunțurile).",
    "Nu adăuga introduceri sau comentarii — doar testul.",
  ];
  return lines.join("\n");
}

/** Prompt pentru CORECTAREA unei lucrări (text extras prin OCR). */
export function buildCorrectPrompt(ocrText: string): string {
  return [
    "Ești profesor de matematică. Mai jos e rezolvarea unui elev, extrasă dintr-o poză (poate avea mici erori de recunoaștere).",
    "Verifică pas cu pas: indică EXACT unde e greșit (cu explicație), arată corectarea, apoi dă o notă orientativă de la 1 la 10.",
    "Scrie formulele în LaTeX ($...$). Fii clar și încurajator.",
    "",
    "Rezolvarea elevului:",
    ocrText.trim().slice(0, 6000),
  ].join("\n");
}
