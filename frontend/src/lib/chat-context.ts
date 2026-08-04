/**
 * Context Chat AI (2026-08-04) — construiește system-prompt-ul specializat pe
 * matematică ȘI „cunoașterea aplicației" (module + index bibliotecă de formule),
 * ca asistentul să răspundă și la „unde găsesc X în aplicație". Funcție PURĂ,
 * testabilă. Indexul e compact (clasă → grupuri), nu toate cele 337 formule.
 */
import mathData from "@/components/editor/math-data.json";
import { TABS } from "@/lib/tab-config";

type MathData = {
  formule: Record<string, { grup: string }[]>;
};

/** „clasa V: Aritmetică, Geometrie · clasa VIII: Funcții, …" (grupuri unice per clasă). */
export function buildLibraryIndex(): string {
  const formule = (mathData as MathData).formule || {};
  const order = ["5", "6", "7", "8", "9", "10", "11", "12"];
  const roman: Record<string, string> = {
    "5": "V",
    "6": "VI",
    "7": "VII",
    "8": "VIII",
    "9": "IX",
    "10": "X",
    "11": "XI",
    "12": "XII",
  };
  const parts: string[] = [];
  for (const c of order) {
    const items = formule[c];
    if (!items || items.length === 0) continue;
    const groups = Array.from(new Set(items.map((i) => i.grup)));
    parts.push(`clasa ${roman[c] || c}: ${groups.join(", ")}`);
  }
  return parts.join(" · ");
}

/** Lista modulelor aplicației (din registrul de taburi). */
export function buildModulesList(): string {
  return TABS.map((t) => `${t.label}`).join(", ");
}

/**
 * System-prompt complet. `docContext` (opțional) = conținutul documentului curent
 * din editor, ca asistentul să răspundă „despre ce am deschis acum".
 */
export function buildSystemPrompt(docContext?: string): string {
  const lib = buildLibraryIndex();
  const modules = buildModulesList();
  const lines = [
    "Ești un asistent de MATEMATICĂ pentru o profesoară (Cristina) și elevii ei, la nivel gimnaziu–liceu (România/Slovacia).",
    "Răspunde în ROMÂNĂ (sau slovacă dacă întrebarea e în slovacă), clar și la obiect.",
    "Scrie formulele matematice între semne de dolar: $...$ pentru inline, $$...$$ pentru bloc (se randează cu KaTeX). Folosește notație LaTeX corectă.",
    "La rezolvări, arată pașii pe scurt. La corectarea unei teme, indică exact unde e greșeala și cum se corectează.",
    "Ești onest: dacă nu ești sigur de un calcul, spune-o și sugerează verificarea cu modulul Calculator din aplicație.",
    "",
    `Aplicația în care ești integrat are modulele: ${modules}.`,
    "Editorul are un meniu „Matematică” (buton Σ) cu formule pe clase, un constructor de structuri (fracție/radical/limită/sumă/integrală, imbricabile), figuri geometrice editabile și import OCR.",
    "Modulul Calculator: științific + grafic de funcții + matrice/sisteme. Modulul Planșe: generatoare de fișe printabile.",
    lib ? `Biblioteca de formule din editor acoperă: ${lib}.` : "",
    "Dacă te întreabă unde găsește ceva în aplicație, îndrumă-l concret (ex. „Editor → Matematică → clasa VII → grupul Teoreme”).",
  ];
  if (docContext && docContext.trim()) {
    lines.push(
      "",
      "Documentul deschis acum în editor (context — folosește-l dacă întrebarea se referă la el):",
      docContext.trim().slice(0, 4000),
    );
  }
  return lines.filter((l) => l !== "").join("\n");
}
