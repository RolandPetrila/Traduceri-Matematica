import * as fs from "fs";
import * as path from "path";
import { CURRICULUM } from "./curriculum";
import { refToFile } from "./ref";
import { MAX_REGULAMENT_CHARS } from "./prompt";
import type { CurriculumCycle } from "./types";

/**
 * Gate de GROUNDING (trap 4, runda advisor F3): fiecare nod din skeleton care declară
 * un `regulament_ref` TREBUIE să aibă fișierul asset corespunzător, ne-gol și sub
 * plafonul de prompt — altfel `fetch`-ul din app dă 404 tăcut ȘI, dacă ar depăși
 * plafonul, coada de siguranță (Interdicții/Densitate) ar fi tăiată. Testul folosește
 * `refToFile` PARTAJAT cu aplicația (nu o re-implementare), ca maparea și checker-ul
 * să nu poată diverge. Cultura proiectului: verificator INDEPENDENT + control negativ.
 */

const REG_DIR = path.resolve(__dirname, "../../../public/scolare/regulamente");

/** Adună toate `regulament_ref`-urile declarate în skeleton. */
function collectRefs(curriculum: CurriculumCycle[] = CURRICULUM): string[] {
  const refs: string[] = [];
  curriculum.forEach((c) =>
    c.nivele.forEach((l) =>
      l.noduri.forEach((n) => {
        if (n.regulament_ref) refs.push(n.regulament_ref);
      }),
    ),
  );
  return refs;
}

describe("regulament files (gate de grounding)", () => {
  const refs = collectRefs();

  test("skeleton-ul are cel puțin un nod ghidat", () => {
    expect(refs.length).toBeGreaterThan(0);
  });

  test.each(refs)(
    "regulament_ref „%s” → fișier existent, ne-gol, sub plafon",
    (ref) => {
      const file = path.join(REG_DIR, refToFile(ref));
      expect(fs.existsSync(file)).toBe(true);
      const text = fs.readFileSync(file, "utf8");
      // ne-gol (un regulament util are cel puțin câteva sute de caractere)
      expect(text.trim().length).toBeGreaterThan(200);
      // sub plafonul de prompt → tăierea din prompt.ts nu poate mânca Interdicții/Densitate
      expect(text.length).toBeLessThanOrEqual(MAX_REGULAMENT_CHARS);
    },
  );

  test("control negativ: un regulament_ref inexistent NU are fișier (checker-ul chiar discriminează)", () => {
    const bogus = "primar/clasa-0/materie-inexistenta-xyz";
    const file = path.join(REG_DIR, refToFile(bogus));
    expect(fs.existsSync(file)).toBe(false);
  });
});
