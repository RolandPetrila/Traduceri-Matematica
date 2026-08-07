// Verificator de completitudine INDEPENDENT pt skeleton-ul curricular.
// Disciplina proiectului (numere.js solver, round-trip HTML): verificatorul NU împarte
// cod cu extractorul. Oracolul de mai jos = copie VERBATIM a celor 4 config-uri Carla
// (Curricula/config_*.json), tastată separat de skeleton-ul din curriculum/*.ts. Dacă
// skeleton-ul (hand-authored) diverge de oracol (nod lipsă/în plus/greșit) → FAIL.
//
// „Acoperire 100%" = acest verificator trece pe TOATE cele 16 nivele. Vezi §5 din
// docs/PLAN_SCOLARE_2026-08-07.md.

import type { CurriculumCycle } from "./types";
import { CURRICULUM } from "./curriculum";

/** Oracolul: pt fiecare ciclu, cheia de nivel (exact ca-n config) → lista materii/domenii
 *  EXACTĂ (string-uri fără diacritice, ca-n config_*.json). Tastat independent de skeleton. */
const ORACLE: Record<string, Record<string, string[]>> = {
  gradinita: {
    Grupa_Mica: [
      "Comunicare (DLC)",
      "Matematica (DS)",
      "Educatie Plastica (DEC)",
    ],
    Grupa_Mijlocie: [
      "Comunicare (DLC)",
      "Matematica (DS)",
      "Educatie Plastica (DEC)",
      "Practica (DOS)",
    ],
    Grupa_Mare: [
      "Comunicare (DLC)",
      "Matematica (DS)",
      "Educatie Plastica (DEC)",
      "Practica (DOS)",
      "Cunoasterea Mediului",
    ],
  },
  primar: {
    Clasa_0: [
      "Comunicare in Limba Romana",
      "Matematica si Explorarea Mediului",
      "Arte Vizuale",
    ],
    Clasa_1: [
      "Comunicare in Limba Romana",
      "Matematica si Explorarea Mediului",
      "Arte Vizuale si Abilitati Practice",
    ],
    Clasa_2: [
      "Comunicare in Limba Romana",
      "Matematica si Explorarea Mediului",
      "Arte Vizuale",
      "Dezvoltare Personala",
    ],
    Clasa_3: [
      "Limba si Literatura Romana",
      "Matematica",
      "Stiinte ale Naturii",
      "Educatie Civica",
      "Joc si miscare",
    ],
    Clasa_4: [
      "Limba si Literatura Romana",
      "Matematica",
      "Stiinte ale Naturii",
      "Istorie",
      "Geografie",
      "Educatie Civica",
    ],
  },
  gimnaziu: {
    Clasa_5: [
      "Limba si Literatura Romana",
      "Matematica",
      "Limba Engleza",
      "Istorie",
      "Geografie",
      "Biologie",
      "Educatie Tehnologica",
      "Informatica si TIC",
      "Educatie Sociala",
    ],
    Clasa_6: [
      "Limba si Literatura Romana",
      "Matematica",
      "Limba Engleza",
      "Fizica",
      "Istorie",
      "Geografie",
      "Biologie",
      "Educatie Tehnologica",
      "Informatica si TIC",
      "Educatie Sociala",
    ],
    Clasa_7: [
      "Limba si Literatura Romana",
      "Matematica",
      "Limba Engleza",
      "Fizica",
      "Chimie",
      "Istorie",
      "Geografie",
      "Biologie",
      "Educatie Tehnologica",
      "Informatica si TIC",
      "Educatie Sociala",
    ],
    Clasa_8: [
      "Limba si Literatura Romana",
      "Matematica",
      "Limba Engleza",
      "Fizica",
      "Chimie",
      "Istorie",
      "Geografie",
      "Biologie",
      "Educatie Sociala",
    ],
  },
  liceu: {
    Clasa_9: [
      "Limba si Literatura Romana",
      "Matematica",
      "Informatica",
      "Limba Engleza",
      "Fizica",
      "Chimie",
      "Biologie",
      "Istorie",
      "Geografie",
      "Logica",
    ],
    Clasa_10: [
      "Limba si Literatura Romana",
      "Matematica",
      "Informatica",
      "Limba Engleza",
      "Fizica",
      "Chimie",
      "Biologie",
      "Istorie",
      "Geografie",
      "Psihologie",
    ],
    Clasa_11: [
      "Limba si Literatura Romana",
      "Matematica",
      "Informatica",
      "Limba Engleza",
      "Fizica",
      "Chimie",
      "Biologie",
      "Istorie",
      "Geografie",
      "Economie",
    ],
    Clasa_12: [
      "Limba si Literatura Romana",
      "Matematica",
      "Informatica",
      "Limba Engleza",
      "Fizica",
      "Chimie",
      "Biologie",
      "Istorie",
      "Geografie",
      "Filosofie",
    ],
  },
};

export interface CompletenessResult {
  ok: boolean;
  errors: string[];
  /** Nr nivele verificate în skeleton. */
  levels: number;
  /** Nr nivele așteptate (din oracol). */
  expectedLevels: number;
  /** Nr total noduri (materii/domenii) verificate. */
  nodes: number;
}

const sorted = (a: string[]) => [...a].sort();

/**
 * Compară skeleton-ul cu oracolul pe TOATE nivelele. „100%" = ok===true.
 * Acceptă un skeleton injectat (default = cel real) — testele pasează o copie
 * deliberat stricată ca să dovedească faptul că verificatorul are dinți.
 */
export function checkCompleteness(
  curriculum: CurriculumCycle[] = CURRICULUM,
): CompletenessResult {
  const errors: string[] = [];
  let nodes = 0;

  const expectedLevels = Object.values(ORACLE).reduce(
    (sum, cycle) => sum + Object.keys(cycle).length,
    0,
  );

  // 1. Fiecare ciclu din oracol există în skeleton, cu exact aceleași chei de nivel.
  for (const [cycleId, oracleCycle] of Object.entries(ORACLE)) {
    const cycle = curriculum.find((c) => c.id === cycleId);
    if (!cycle) {
      errors.push(`Ciclu lipsă în skeleton: ${cycleId}`);
      continue;
    }
    const skelKeys = sorted(cycle.nivele.map((l) => l.sursa_cheie));
    const oracleKeys = sorted(Object.keys(oracleCycle));
    if (JSON.stringify(skelKeys) !== JSON.stringify(oracleKeys)) {
      errors.push(
        `[${cycleId}] chei de nivel diferite: skeleton=${JSON.stringify(skelKeys)} vs oracol=${JSON.stringify(oracleKeys)}`,
      );
    }

    // 2. Fiecare nivel: setul de sursa_nume == oracol (exact, order-independent).
    for (const [levelKey, oracleNodes] of Object.entries(oracleCycle)) {
      const level = cycle.nivele.find((l) => l.sursa_cheie === levelKey);
      if (!level) {
        errors.push(`[${cycleId}] nivel lipsă în skeleton: ${levelKey}`);
        continue;
      }
      const skelNodes = sorted(level.noduri.map((n) => n.sursa_nume));
      const expNodes = sorted(oracleNodes);
      nodes += level.noduri.length;
      if (JSON.stringify(skelNodes) !== JSON.stringify(expNodes)) {
        errors.push(
          `[${cycleId}/${levelKey}] noduri diferite:\n  skeleton=${JSON.stringify(skelNodes)}\n  oracol  =${JSON.stringify(expNodes)}`,
        );
      }
    }
  }

  // 3. Skeleton-ul nu are cicluri în plus față de oracol.
  for (const cycle of curriculum) {
    if (!ORACLE[cycle.id])
      errors.push(`Ciclu în plus în skeleton (lipsă din oracol): ${cycle.id}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    levels: curriculum.reduce((sum, c) => sum + c.nivele.length, 0),
    expectedLevels,
    nodes,
  };
}
