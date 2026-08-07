/**
 * Constructor de prompt pentru modulul „Școlare 🌐" — logică PURĂ (fără React),
 * testabilă (modelul test-generator.ts). Generarea rulează prin `sendChat`
 * (chat-providers) → /api/proxy; aici doar formulăm prompt-ul din skeleton + regulament.
 * Vezi docs/PLAN_SCOLARE_2026-08-07.md §4.3.
 */
import type { CurriculumCycle, CurriculumLevel, CurriculumNode } from "./types";

export const DIFICULTATI = ["Ușor", "Standard", "Avansat"] as const;
export type Dificultate = (typeof DIFICULTATI)[number];

export interface PromptInput {
  cycle: CurriculumCycle;
  level: CurriculumLevel;
  node: CurriculumNode;
  /** Textul de regulament (asset separat), dacă e disponibil pt acest nod. */
  regulament?: string;
  dificultate: Dificultate;
  /** Rubrica opțională „Cerință specifică" (text liber al utilizatorului). */
  cerintaSpecifica?: string;
  /** Semnături/concepte deja folosite (anti-repetare) — descrieri scurte de evitat. */
  avoid?: string[];
  /** Câte exerciții să conțină fișa (implicit 5). */
  nrExercitii?: number;
}

/** Prompt de sistem specific fișelor școlare (peste buildSystemPrompt din chat-context). */
export function buildScolareSystemPrompt(): string {
  return [
    "Ești un cadru didactic din România care creează fișe de lucru pentru elevi, aliniate la programa școlară oficială aprobată.",
    "Generezi conținut ORIGINAL, corect și adecvat vârstei/clasei. Nu copiezi din manuale.",
    "Scrii formulele matematice în LaTeX între semne de dolar ($...$).",
    "Răspunzi DOAR cu fișa (fără introduceri, fără comentarii meta).",
  ].join(" ");
}

/** Prompt de generare a unei fișe pentru un nod (materie/domeniu) al skeleton-ului. */
export function buildScolarePrompt(input: PromptInput): string {
  const {
    cycle,
    level,
    node,
    regulament,
    dificultate,
    cerintaSpecifica,
    avoid,
    nrExercitii = 5,
  } = input;

  const tipNod =
    level.tip === "domeniu" ? "domeniul de dezvoltare" : "disciplina";
  const lines: string[] = [];

  lines.push(
    `Creează o fișă de lucru A4 pentru ${cycle.nume} — ${level.nume}, ${tipNod} „${node.nume}", nivel de dificultate ${dificultate}.`,
  );
  lines.push(
    `Fișa are exact ${nrExercitii} exerciții, numerotate de la 1 la ${nrExercitii}.`,
  );

  if (node.capitole && node.capitole.length) {
    lines.push(
      "Acoperă teme din programa oficială (variază între ele, nu toate din același capitol): " +
        node.capitole.join("; ") +
        ".",
    );
  }

  if (regulament && regulament.trim()) {
    lines.push(
      "Respectă STRICT următorul regulament de conținut al clasei (concepte permise, tipuri de exerciții, interdicții):",
      "---",
      regulament.trim().slice(0, 4000),
      "---",
    );
  }

  if (node.in_reforma) {
    lines.push(
      "ATENȚIE: programa acestei clase e în reformă curriculară (2026-2027). Rămâi la concepte fundamentale, larg acceptate, ale disciplinei.",
    );
  }

  if (avoid && avoid.length) {
    lines.push(
      "EVITĂ să repeți exerciții deja folosite (generează altele NOI): " +
        avoid.slice(0, 20).join("; ") +
        ".",
    );
  }

  if (cerintaSpecifica && cerintaSpecifica.trim()) {
    lines.push(
      `Cerință specifică a utilizatorului (are prioritate în limitele regulamentului): ${cerintaSpecifica.trim().slice(0, 500)}`,
    );
  }

  lines.push(
    "Structură: un titlu scurt al fișei, apoi exercițiile numerotate (fiecare pe rândul lui, cu enunț clar).",
    "La final adaugă o secțiune „Barem / Soluții” cu răspunsul complet al fiecărui exercițiu.",
    "Formulele în LaTeX ($...$). Fără introduceri sau comentarii — doar fișa.",
  );

  return lines.join("\n");
}
