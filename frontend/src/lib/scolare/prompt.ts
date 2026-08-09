/**
 * Constructor de prompt pentru modulul „Școlare 🌐" — logică PURĂ (fără React),
 * testabilă (modelul test-generator.ts). Generarea rulează prin `sendChat`
 * (chat-providers) → /api/proxy; aici doar formulăm prompt-ul din skeleton + regulament.
 * Vezi docs/PLAN_SCOLARE_2026-08-07.md §4.3.
 */
import type { CurriculumCycle, CurriculumLevel, CurriculumNode } from "./types";
import { isDrawingEligible, DRAWING_RULE } from "./drawing/drawing-rule";

export const DIFICULTATI = ["Ușor", "Standard", "Avansat"] as const;
export type Dificultate = (typeof DIFICULTATI)[number];

/**
 * Plafon de caractere pt textul de regulament inclus în prompt. Era 4000 hardcodat
 * inline (F0/F1) — dar `gimnaziu_clasa6/7_matematica.md` (4251/4120 caractere) îl
 * depășeau, deci coada lor (Interdicții + Densitate = partea de siguranță) era tăiată
 * TĂCUT. Ridicat la o valoare cu marjă și EXPORTAT ca `regulament-files.test.ts` să
 * poată garanta (gate cu dinți) că niciun regulament nu depășește plafonul → tăierea
 * de mai jos devine plasă de siguranță, nu comportament activ. Vezi runda advisor F3.
 */
export const MAX_REGULAMENT_CHARS = 8000;

/**
 * Regulă de AUTONOMIE PRIN TEXT. Modulul generează DOAR text + LaTeX (renderul e
 * `renderMathText` → text/KaTeX; nu există canvas/SVG/figuri/chenare — verificat în cod).
 * Fără această regulă, AI-ul imita exercițiile „din imagine/desen" modelate în unele
 * regulamente și producea fișe cu referințe la vizuale inexistente („Privește fluturele
 * din imagine", „Colorează căsuța din imagine") — bug arhitectural raportat 2026-08-09.
 * E un BAN + REDIRECT (nu doar interdicție): un ban gol ar face modelul să renunțe la
 * tipul de exercițiu (ar goli Educație Plastică); redirect-ul cere ca ELEVUL să creeze
 * vizualul din descrierea text. Exportată ca să o poată referi testele/verificarea.
 */
export const IMAGE_AUTONOMY_RULE = [
  "REGULĂ ABSOLUTĂ — fișă 100% autonomă prin text (are PRIORITATE peste orice exemplu, formulare sau cerință de mai sus, inclusiv peste regulament):",
  "Fișa se tipărește ca TEXT simplu — aplicația NU poate reda imagini, desene, figuri, hărți, scheme, tablouri, fotografii sau chenare grafice.",
  "NU formula exerciții care presupun un element vizual pe care elevul îl privește sau pe care operează. INTERZIS: referiri la un vizual pre-existent — „din imagine/desen/figură/tablou/hartă/schemă/chenar”, „de mai jos”/„alăturat”/„de lângă”/„arătat” când trimit la un vizual, „privește/observă imaginea”, „completează cealaltă jumătate a” unui obiect deja desenat, „colorează/numără/încercuiește ... din imagine/desen”, „decupează forma din chenar”.",
  "Dacă o sarcină ar avea nevoie de un vizual, REFORMULEAZ-O astfel încât ELEVUL să deseneze/creeze el vizualul după descrierea din text, apoi să lucreze pe propria lui lucrare. Exemple: în loc de „completează jumătatea fluturelui din imagine” → „desenează un fluture cu aripile identice (simetrice)”; în loc de „numără florile din desen” → „desenează 3 flori, apoi încă 2, și scrie câte sunt în total”; în loc de „colorează căsuța din imagine după cod” → „desenează o căsuță și coloreaz-o: acoperișul roșu, pereții galbeni, ușa albastră”.",
  "Toate datele necesare (numere, culori, poziții, dimensiuni) se dau în TEXT, niciodată printr-un vizual.",
].join(" ");

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
export function buildScolareSystemPrompt(
  cycle?: CurriculumCycle,
  level?: CurriculumLevel,
): string {
  const desenElig = cycle && level && isDrawingEligible(cycle, level);
  return [
    "Ești un cadru didactic din România care creează fișe de lucru pentru elevi, aliniate la programa școlară oficială aprobată.",
    "Generezi conținut ORIGINAL, corect și adecvat vârstei/clasei. Nu copiezi din manuale.",
    "Scrii formulele matematice în LaTeX între semne de dolar ($...$).",
    desenElig
      ? "Aplicația poate desena AUTOMAT, dar DOAR prin marcaje exacte [[DESEN ...]] (vezi instrucțiunea de mai jos) — nu descrie tu vizualul în text."
      : "Fișa se tipărește ca TEXT (aplicația nu redă imagini/desene/figuri) — nu formula exerciții care presupun un vizual pe care elevul îl privește sau pe care operează; dacă o sarcină ar cere un vizual, reformuleaz-o astfel încât elevul să-l deseneze el din descrierea din text.",
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
      regulament.trim().slice(0, MAX_REGULAMENT_CHARS),
      "---",
    );
  }

  if (node.in_reforma) {
    lines.push(
      `ATENȚIE: programa acestei clase e în reformă curriculară (2026-2027). Rămâi la concepte fundamentale, larg acceptate, ale ${tipNod}.`,
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
    // Materiile de primar au multe exerciții „completează spațiul": fără această regulă,
    // modelul umple răspunsurile cu rânduri lungi de „_____" care ating plafonul de
    // tokeni și trunchiază fișa (baremul dispare) — prins la proba LIVE F3.
    "Pentru spațiile de răspuns folosește un marcaj SCURT (de exemplu «______» de cel mult ~10 caractere, «□» sau «(...)»). NU genera linii sau zone goale de scriere pentru elev (elevul scrie pe caiet) și NU repeta niciun caracter de mai mult de 10 ori la rând.",
  );

  // Regula de desen/autonomie prin text — plasată ULTIMA (recency) și marcată explicit ca
  // având prioritate peste regulament + cerința utilizatorului, ca să câștige contestul de
  // specificitate contra blocului „Respectă STRICT regulamentul" de mai sus. Vezi runda
  // advisor. Cele două reguli sunt MUTUAL EXCLUSIVE (nu se adaugă amândouă — un model care
  // primește simultan „nu te referi NICIODATĂ la un vizual" și „emite un marcaj pentru un
  // vizual" se contrazice): DRAWING_RULE doar pt nodurile eligibile (grădiniță + primar
  // cl.0-1, vezi drawing-rule.ts), IMAGE_AUTONOMY_RULE neschimbată pt restul.
  lines.push(
    isDrawingEligible(cycle, level) ? DRAWING_RULE : IMAGE_AUTONOMY_RULE,
  );

  return lines.join("\n");
}
