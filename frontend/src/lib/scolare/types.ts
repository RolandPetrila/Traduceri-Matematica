// Modul „Școlare 🌐" — tipuri pentru skeleton-ul curricular (structura de selecție)
// grădiniță → liceu. Vezi docs/PLAN_SCOLARE_2026-08-07.md §2/§4.
//
// SKELETON = arborele mărginit ciclu → nivel → nod (materie/domeniu). Aici trăiește
// „acoperirea 100%": e verificabil independent (vezi verifier.ts). CONȚINUTUL (fișele
// AI) e nemărginit și NU face parte din skeleton.

/** Forma nodului: „materie" (școală) sau „domeniu de dezvoltare" (grădiniță). */
export type NodeKind = "materie" | "domeniu";

/** Un nod selectabil dintr-un nivel: o materie (școală) sau un domeniu (grădiniță). */
export interface CurriculumNode {
  /** Slug stabil, ex. "matematica". Unic în cadrul nivelului. */
  id: string;
  /** Nume afișat (cu diacritice), ex. „Matematică". */
  nume: string;
  /**
   * Numele EXACT din config-ul sursă Carla (fără diacritice, ex. "Matematica").
   * Folosit de verificatorul de completitudine pt comparație exactă cu oracolul.
   */
  sursa_nume: string;
  /** Cod de domeniu la grădiniță (DLC/DS/DEC/DOS), extras din paranteza numelui. */
  cod?: string;
  /** Capitole/teme din programa oficială aprobată (îmbogățire skeleton, opțional). */
  capitole?: string[];
  /** Pointer către asset-ul de regulament (text de reguli), dacă există conținut. */
  regulament_ref?: string;
  /** True dacă disciplina e sub reforma curriculară activă (liceu 2026-2027). */
  in_reforma?: boolean;
}

/** Un nivel de studiu: o clasă (școală) sau o grupă (grădiniță). */
export interface CurriculumLevel {
  /** Slug stabil, ex. "clasa-5", "grupa-mare". */
  id: string;
  /** Nume afișat, ex. „Clasa a V-a", „Grupa Mare". */
  nume: string;
  /** Cheia EXACTĂ din config-ul sursă (ex. "Clasa_5", "Grupa_Mare") — pt verificator. */
  sursa_cheie: string;
  /** Forma nodurilor din acest nivel. */
  tip: NodeKind;
  /** Nodurile (materii sau domenii). */
  noduri: CurriculumNode[];
}

/** Un ciclu de învățământ: grădiniță / primar / gimnaziu / liceu. */
export interface CurriculumCycle {
  /** Slug stabil, ex. "gimnaziu". */
  id: string;
  /** Nume afișat, ex. „Gimnaziu". */
  nume: string;
  /** URL-ul sursei oficiale de aliniere (programa aprobată) — trasabilitate. */
  sursa_url: string;
  /** Data extragerii (ISO), pt anti-stale. */
  data_extragere: string;
  /** True dacă întreg ciclul e sub reformă curriculară activă (liceu). */
  in_reforma?: boolean;
  /** Nivelele (clase/grupe). */
  nivele: CurriculumLevel[];
}
