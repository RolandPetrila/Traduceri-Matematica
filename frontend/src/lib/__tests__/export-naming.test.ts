import { markEngine } from "../export-naming";

describe("markEngine", () => {
  it("inserts D after a numeric prefix for DeepL", () => {
    expect(markEngine("1.0_Analyse CettaClear 2026", "deepl")).toBe(
      "1.0_D_Analyse CettaClear 2026",
    );
  });

  it("inserts G after a numeric prefix for Gemini", () => {
    expect(markEngine("2.1_romana", "gemini")).toBe("2.1_G_romana");
  });

  it("handles a single-number prefix", () => {
    expect(markEngine("3_test", "deepl")).toBe("3_D_test");
  });

  it("prepends the marker when there is no numeric prefix", () => {
    expect(markEngine("raport", "deepl")).toBe("D_raport");
    expect(markEngine("raport", "gemini")).toBe("G_raport");
  });

  it("treats any non-deepl engine as Gemini (G)", () => {
    expect(markEngine("1.0_x", "nllb")).toBe("1.0_G_x");
  });

  it("does not treat a mid-name number as a prefix", () => {
    expect(markEngine("Analyse 2026", "deepl")).toBe("D_Analyse 2026");
  });
});
