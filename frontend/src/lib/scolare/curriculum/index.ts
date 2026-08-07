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

export { gradinita, primar, gimnaziu, liceu };
