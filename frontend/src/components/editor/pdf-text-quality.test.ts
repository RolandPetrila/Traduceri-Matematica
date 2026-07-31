/**
 * R7.2 — Test pentru euristica de calitate a stratului-text PDF.
 * Rulează pe TEXT REAL extras din cele 3 fișiere ale lui Roland (fixture-uri):
 * ambii poli obligatorii (advisor) — Filtrasan/CettaClear (rău) → OCR;
 * Unghiuri (bun) → text — ca să NU overfitteze pragul pe un singur fișier.
 */
import fs from "fs";
import path from "path";
import { assessPdfText } from "./pdf-text-quality";

const FIX = path.join(__dirname, "__tests__", "fixtures");
const load = (name: string) =>
  fs.readFileSync(path.join(FIX, `${name}.txt`), "utf-8");

describe("assessPdfText — poli reali (R7.2, negative control)", () => {
  it("Filtrasan: strat-text OCR-prost → NU fiabil (forțează OCR)", () => {
    const r = assessPdfText(load("pdftext_filtrasan_bad"), 1);
    expect(r.reliable).toBe(false);
    expect(r.metrics.cleanWordRatio).toBeLessThan(0.55);
  });

  it("CettaClear: strat-text OCR-prost → NU fiabil (forțează OCR)", () => {
    const r = assessPdfText(load("pdftext_cettaclear_bad"), 1);
    expect(r.reliable).toBe(false);
  });

  it("Unghiuri: strat-text curat (born-digital) → FIABIL (rămâne text)", () => {
    const r = assessPdfText(load("pdftext_unghiuri_good"), 1);
    expect(r.reliable).toBe(true);
    expect(r.metrics.cleanWordRatio).toBeGreaterThanOrEqual(0.55);
  });
});

describe("assessPdfText — cazuri limită", () => {
  it("PDF scanat (fără strat-text) → NU fiabil", () => {
    expect(assessPdfText("", 1).reliable).toBe(false);
    expect(assessPdfText("   \n  \n ", 3).reliable).toBe(false);
  });

  it("prea puțin text ca să judeci → NU fiabil", () => {
    // 5 cuvinte curate, dar sub pragul de tokenuri/pagină.
    expect(assessPdfText("Titlu foarte scurt document aici", 1).reliable).toBe(
      false,
    );
  });

  it("proză curată amplă → fiabil", () => {
    const prose = Array(60)
      .fill(
        "Această propoziție conține numai cuvinte curate scrise corect în limba română",
      )
      .join(" ");
    const r = assessPdfText(prose, 1);
    expect(r.reliable).toBe(true);
    expect(r.metrics.cleanWordRatio).toBeGreaterThan(0.8);
  });

  it("garbaj OCR simulat (litere+cifre amestecate, simboluri) → NU fiabil", () => {
    const garbage = Array(50)
      .fill("o971/78s6-0 ?i^.i!' rl*,*-,. lnstitut CmbH 8ad 4r,,t,i")
      .join(" ");
    expect(assessPdfText(garbage, 1).reliable).toBe(false);
  });
});
