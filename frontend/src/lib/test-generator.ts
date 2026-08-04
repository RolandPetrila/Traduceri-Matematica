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

/** Prompt pentru GENERAREA unui test (AI returnează probleme numerotate + barem). */
export function buildGeneratePrompt(
  clasa: string,
  tema: string,
  count: number,
  difficulty: Difficulty,
  withAnswers: boolean,
): string {
  const n = Math.min(30, Math.max(1, Math.floor(count) || 5));
  const lines = [
    `Generează un test de matematică pentru clasa a ${clasa}-a, tema „${tema}", nivel ${difficulty}.`,
    `Creează exact ${n} probleme, numerotate 1..${n}, potrivite programei românești pentru această clasă.`,
    "Scrie formulele în LaTeX între semne de dolar ($...$). Fiecare problemă pe rând nou.",
    withAnswers
      ? "După probleme, adaugă o secțiune „Barem/Soluții” cu răspunsul fiecărei probleme."
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
