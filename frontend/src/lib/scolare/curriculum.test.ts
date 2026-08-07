import type { CurriculumCycle } from "./types";
import { CURRICULUM, getNode, getCycle, totalLevels } from "./curriculum";
import { checkCompleteness } from "./verifier";

const clone = (): CurriculumCycle[] =>
  JSON.parse(JSON.stringify(CURRICULUM)) as CurriculumCycle[];

describe("skeleton curricular — acoperire 100%", () => {
  test("skeleton-ul REAL trece verificatorul de completitudine (0 erori)", () => {
    const r = checkCompleteness();
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  test("16 nivele (grădiniță 3 + primar 5 + gimnaziu 4 + liceu 4)", () => {
    expect(totalLevels()).toBe(16);
    const r = checkCompleteness();
    expect(r.levels).toBe(16);
    expect(r.expectedLevels).toBe(16);
  });

  test("112 noduri total (materii + domenii)", () => {
    // 12 (grădiniță) + 21 (primar) + 39 (gimnaziu) + 40 (liceu)
    expect(checkCompleteness().nodes).toBe(112);
  });

  test("cele 4 cicluri există", () => {
    expect(CURRICULUM.map((c) => c.id).sort()).toEqual([
      "gimnaziu",
      "gradinita",
      "liceu",
      "primar",
    ]);
  });
});

describe("verificatorul are DINȚI (controale negative)", () => {
  test("nod ȘTERS din Clasa 5 → FAIL", () => {
    const broken = clone();
    const cl5 = broken
      .find((c) => c.id === "gimnaziu")!
      .nivele.find((l) => l.id === "clasa-5")!;
    cl5.noduri.pop(); // scoate ultima materie
    const r = checkCompleteness(broken);
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toContain("gimnaziu/Clasa_5");
  });

  test("nod ÎN PLUS în Grupa Mare → FAIL", () => {
    const broken = clone();
    const gm = broken
      .find((c) => c.id === "gradinita")!
      .nivele.find((l) => l.id === "grupa-mare")!;
    gm.noduri.push({ id: "x", nume: "X", sursa_nume: "Materie Inventata" });
    const r = checkCompleteness(broken);
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toContain("gradinita/Grupa_Mare");
  });

  test("sursa_nume greșit (typo) → FAIL", () => {
    const broken = clone();
    const cl5 = broken
      .find((c) => c.id === "gimnaziu")!
      .nivele.find((l) => l.id === "clasa-5")!;
    cl5.noduri.find((n) => n.id === "matematica")!.sursa_nume = "Matematika"; // typo
    const r = checkCompleteness(broken);
    expect(r.ok).toBe(false);
  });

  test("nivel ȘTERS → FAIL", () => {
    const broken = clone();
    const gimn = broken.find((c) => c.id === "gimnaziu")!;
    gimn.nivele = gimn.nivele.filter((l) => l.id !== "clasa-8");
    const r = checkCompleteness(broken);
    expect(r.ok).toBe(false);
  });
});

describe("îmbogățire pilot + marcaj reformă", () => {
  test("Clasa 5 Matematică are capitole (programa oficială) + regulament_ref", () => {
    const mate = getNode("gimnaziu", "clasa-5", "matematica");
    expect(mate).toBeDefined();
    expect(mate!.capitole && mate!.capitole.length).toBeGreaterThanOrEqual(6);
    expect(mate!.regulament_ref).toBe("gimnaziu/clasa-5/matematica");
  });

  test("liceul e marcat in_reforma (ciclu + noduri)", () => {
    const liceu = getCycle("liceu")!;
    expect(liceu.in_reforma).toBe(true);
    expect(
      liceu.nivele.every((l) => l.noduri.every((n) => n.in_reforma === true)),
    ).toBe(true);
  });

  test("grădinița folosește domenii (cu cod), școala folosește materii", () => {
    expect(
      getCycle("gradinita")!.nivele.every((l) => l.tip === "domeniu"),
    ).toBe(true);
    expect(getCycle("gimnaziu")!.nivele.every((l) => l.tip === "materie")).toBe(
      true,
    );
    // domeniile au cod DLC/DS/DEC/DOS
    const dom = getNode("gradinita", "grupa-mare", "comunicare");
    expect(dom!.cod).toBe("DLC");
  });
});
