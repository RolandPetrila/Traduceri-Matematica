import type {
  CurriculumCycle,
  CurriculumLevel,
  CurriculumNode,
} from "../types";
import gradinita from "./gradinita";
import primar from "./primar";
import gimnaziu from "./gimnaziu";
import liceu from "./liceu";

/** Skeleton-ul curricular complet: 4 cicluri × nivelele lor (16 nivele total). */
export const CURRICULUM: CurriculumCycle[] = [
  gradinita,
  primar,
  gimnaziu,
  liceu,
];

/** Găsește un ciclu după id (ex. "gimnaziu"). */
export function getCycle(cycleId: string): CurriculumCycle | undefined {
  return CURRICULUM.find((c) => c.id === cycleId);
}

/** Găsește un nivel după (ciclu, nivel). */
export function getLevel(
  cycleId: string,
  levelId: string,
): CurriculumLevel | undefined {
  return getCycle(cycleId)?.nivele.find((l) => l.id === levelId);
}

/** Găsește un nod (materie/domeniu) după (ciclu, nivel, nod). */
export function getNode(
  cycleId: string,
  levelId: string,
  nodeId: string,
): CurriculumNode | undefined {
  return getLevel(cycleId, levelId)?.noduri.find((n) => n.id === nodeId);
}

/** Numărul total de nivele din skeleton (așteptat: 16). */
export function totalLevels(): number {
  return CURRICULUM.reduce((sum, c) => sum + c.nivele.length, 0);
}

/**
 * Descriere ONESTĂ, derivată LIVE din skeleton, a nodurilor GHIDATE curricular
 * (care au `regulament_ref`). Folosită de bannerul „nod ne-ghidat" din ScolarePanel
 * ca să NU rămână stale pe măsură ce acoperirea crește: F0 avea textul hardcodat
 * („acoperă integral doar Clasa 5 Matematică"), ceea ce a devenit fals încă de la F1
 * (Cl.6/7/8 Mate ghidate). Vezi runda advisor F3, trap 2.
 * Ex.: „Gimnaziu (Matematică) · Primar (toate materiile)".
 */
export function describeGroundedCoverage(
  curriculum: CurriculumCycle[] = CURRICULUM,
): string {
  const parts: string[] = [];
  curriculum.forEach((cycle) => {
    let total = 0;
    let grounded = 0;
    const names: string[] = [];
    cycle.nivele.forEach((level) => {
      level.noduri.forEach((node) => {
        total++;
        if (node.regulament_ref) {
          grounded++;
          if (names.indexOf(node.nume) < 0) names.push(node.nume);
        }
      });
    });
    if (grounded === 0) return;
    if (grounded === total) {
      parts.push(`${cycle.nume} (toate materiile)`);
    } else {
      const shown = names.slice(0, 4).join(", ");
      parts.push(`${cycle.nume} (${shown}${names.length > 4 ? " ș.a." : ""})`);
    }
  });
  return parts.join(" · ") || "niciun nod încă";
}

export { gradinita, primar, gimnaziu, liceu };
