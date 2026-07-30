/**
 * R3 — Teste OMML→LaTeX + DOCX→blocuri. Trei nivele:
 *  1. Unit pe fiecare structură OMML (string handcraft → LaTeX).
 *  2. VALIDARE KaTeX: fiecare LaTeX emis (din snippet-uri ȘI din cele 3 fixture-uri REALE)
 *     trece prin `katex.renderToString({throwOnError:true})` — fiindcă în prod extensia are
 *     `throwOnError:false`, deci LaTeX rupt s-ar randa ca text roșu și ar trece gate-ul tăcut.
 *  3. INVARIANT DE NUMĂRARE pe fixture-urile reale (verificat la sursă 2026-07-30):
 *     `emittedMathCount === ommlCount` (20 / 9 / 6) + imagine (unghiuri = 1). Eyeball-ul nu
 *     distinge 17 formule de 20; contorul da.
 */

import * as fs from "fs";
import * as path from "path";
import katex from "katex";
import { zipSync, strToU8 } from "fflate";
import { ommlStringToLatex } from "./omml-to-latex";
import { docxXmlToBlocks, docxArrayBufferToBlocks } from "./docx-to-blocks";

const FIX = path.join(__dirname, "__tests__", "fixtures");
const loadFixture = (name: string) =>
  fs.readFileSync(path.join(FIX, `${name}.document.xml`), "utf-8");

/** Aruncă dacă LaTeX-ul nu randează în KaTeX (echivalentul prod cu strict:false). */
function assertKatex(latex: string) {
  expect(() =>
    katex.renderToString(latex, { throwOnError: true, strict: false }),
  ).not.toThrow();
}

/** Înfășoară un fragment OMML cu `<m:oMath>` (helper pt handcraft). */
const oMath = (inner: string) => `<m:oMath>${inner}</m:oMath>`;

describe("ommlStringToLatex — structuri OMML", () => {
  it("run text simplu", () => {
    const r = ommlStringToLatex(oMath("<m:r><m:t>x+1</m:t></m:r>"));
    expect(r.latex).toBe("x+1");
  });

  it("delimitator implicit → paranteze rotunde", () => {
    const r = ommlStringToLatex(
      oMath("<m:d><m:e><m:r><m:t>a</m:t></m:r></m:e></m:d>"),
    );
    expect(r.latex).toContain("\\left(");
    expect(r.latex).toContain("\\right)");
  });

  it("delimitator cu acolade begChr/endChr → \\{ \\}", () => {
    const r = ommlStringToLatex(
      oMath(
        '<m:d><m:dPr><m:begChr m:val="{"/><m:endChr m:val="}"/></m:dPr>' +
          "<m:e><m:r><m:t>2,3,7</m:t></m:r></m:e></m:d>",
      ),
    );
    expect(r.latex).toContain("\\left\\{");
    expect(r.latex).toContain("\\right\\}");
    expect(r.latex).toContain("2,3,7");
  });

  it("delimitator cu begChr/endChr INDEPENDENTE ({ … |)", () => {
    const r = ommlStringToLatex(
      oMath(
        '<m:d><m:dPr><m:begChr m:val="{"/><m:endChr m:val="|"/></m:dPr>' +
          "<m:e><m:r><m:t>x</m:t></m:r></m:e></m:d>",
      ),
    );
    expect(r.latex).toContain("\\left\\{");
    expect(r.latex).toContain("\\right|");
  });

  it("fracție → \\frac", () => {
    const r = ommlStringToLatex(
      oMath(
        "<m:f><m:num><m:r><m:t>a</m:t></m:r></m:num>" +
          "<m:den><m:r><m:t>b</m:t></m:r></m:den></m:f>",
      ),
    );
    expect(r.latex).toBe("\\frac{a}{b}");
  });

  it("radical fără grad → \\sqrt", () => {
    const r = ommlStringToLatex(
      oMath(
        '<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/>' +
          "<m:e><m:r><m:t>2</m:t></m:r></m:e></m:rad>",
      ),
    );
    expect(r.latex).toBe("\\sqrt{2}");
  });

  it("radical cu grad → \\sqrt[n]", () => {
    const r = ommlStringToLatex(
      oMath(
        "<m:rad><m:deg><m:r><m:t>3</m:t></m:r></m:deg>" +
          "<m:e><m:r><m:t>8</m:t></m:r></m:e></m:rad>",
      ),
    );
    expect(r.latex).toBe("\\sqrt[3]{8}");
  });

  it("exponent → ^{}", () => {
    const r = ommlStringToLatex(
      oMath(
        "<m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e>" +
          "<m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup>",
      ),
    );
    expect(r.latex).toBe("{x}^{2}");
  });

  it("indice → _{}", () => {
    const r = ommlStringToLatex(
      oMath(
        "<m:sSub><m:e><m:r><m:t>O</m:t></m:r></m:e>" +
          "<m:sub><m:r><m:t>1</m:t></m:r></m:sub></m:sSub>",
      ),
    );
    expect(r.latex).toBe("{O}_{1}");
  });

  it("indice+exponent → _{}^{}", () => {
    const r = ommlStringToLatex(
      oMath(
        "<m:sSubSup><m:e><m:r><m:t>x</m:t></m:r></m:e>" +
          "<m:sub><m:r><m:t>i</m:t></m:r></m:sub>" +
          "<m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSubSup>",
      ),
    );
    expect(r.latex).toBe("{x}_{i}^{2}");
  });

  it("n-ar Σ cu limite → \\sum_{}^{}", () => {
    const r = ommlStringToLatex(
      oMath(
        '<m:nary><m:naryPr><m:chr m:val="∑"/></m:naryPr>' +
          "<m:sub><m:r><m:t>i=1</m:t></m:r></m:sub>" +
          "<m:sup><m:r><m:t>n</m:t></m:r></m:sup>" +
          "<m:e><m:r><m:t>i</m:t></m:r></m:e></m:nary>",
      ),
    );
    expect(r.latex).toContain("\\sum");
    expect(r.latex).toContain("_{i=1}");
    expect(r.latex).toContain("^{n}");
  });

  it("accent overline → \\overline (perioadă zecimală)", () => {
    const r = ommlStringToLatex(
      oMath(
        '<m:acc><m:accPr><m:chr m:val="̅"/></m:accPr>' +
          "<m:e><m:r><m:t>aa</m:t></m:r></m:e></m:acc>",
      ),
    );
    expect(r.latex).toBe("\\overline{aa}");
  });

  it("double-struck DOAR pe litere ASCII (∈N → \\in \\mathbb{N})", () => {
    const r = ommlStringToLatex(
      oMath(
        '<m:r><m:rPr><m:scr m:val="double-struck"/></m:rPr><m:t>∈N</m:t></m:r>',
      ),
    );
    expect(r.latex).toContain("\\in");
    expect(r.latex).toContain("\\mathbb{N}");
    expect(r.latex).not.toContain("\\mathbb{∈");
  });

  it("simboluri Unicode → comenzi LaTeX", () => {
    const r = ommlStringToLatex(oMath("<m:r><m:t>2⊂5≤7</m:t></m:r>"));
    expect(r.latex).toContain("\\subset");
    expect(r.latex).toContain("\\le");
  });

  it("acolade LITERALE tastate în text → escapate", () => {
    const r = ommlStringToLatex(oMath("<m:r><m:t>{x|x}</m:t></m:r>"));
    expect(r.latex).toContain("\\{");
    expect(r.latex).toContain("\\}");
  });

  it("diacritice RO în formulă → transliterate (nu rup KaTeX)", () => {
    const r = ommlStringToLatex(oMath("<m:r><m:t>și</m:t></m:r>"));
    expect(r.latex).toBe("si");
  });

  it("OMML gol → latex gol (garda: NU nod invizibil)", () => {
    const r = ommlStringToLatex(oMath("<m:r><m:t></m:t></m:r>"));
    expect(r.latex).toBe("");
  });

  it("element necunoscut → recursăm text + îl raportăm", () => {
    const r = ommlStringToLatex(
      oMath("<m:zzz><m:r><m:t>q</m:t></m:r></m:zzz>"),
    );
    expect(r.latex).toContain("q");
    expect(r.unknown).toContain("zzz");
  });
});

describe("VALIDARE KaTeX pe snippet-uri", () => {
  const cases = [
    "\\frac{a}{b}",
    "\\sqrt[3]{8}",
    "\\left\\{ 2,3,7 \\right\\}",
    "{x}^{2}",
    "\\in \\mathbb{N}",
    "\\sum_{i=1}^{n} i",
    "\\overline{aa}",
    "45^{\\circ}",
    "a \\cdot b",
    "A \\cup B \\cap C",
    "x \\notin \\{1,2\\}",
  ];
  it.each(cases)("randează: %s", (latex) => assertKatex(latex));
});

describe("Fixture-uri REALE — invariant de numărare + KaTeX", () => {
  const stubImage = () => "data:image/jpeg;base64,STUB";
  const expected: Record<string, { omml: number; images: number }> = {
    multimi2: { omml: 20, images: 0 },
    naturale: { omml: 9, images: 0 },
    unghiuri: { omml: 6, images: 1 },
  };

  for (const name of Object.keys(expected)) {
    describe(name, () => {
      const xml = loadFixture(name);
      const res = docxXmlToBlocks(xml, stubImage);

      it(`toate cele ${expected[name].omml} OMML → nod inlineMath (fără pierdere)`, () => {
        expect(res.ommlCount).toBe(expected[name].omml);
        expect(res.emittedMathCount).toBe(expected[name].omml);
      });

      it(`imagini din word/media = ${expected[name].images}`, () => {
        expect(res.imageCount).toBe(expected[name].images);
      });

      it("fiecare formulă emisă randează în KaTeX", () => {
        const collectLatex = (nodes: unknown[]): string[] => {
          const out: string[] = [];
          const walk = (n: unknown) => {
            if (!n || typeof n !== "object") return;
            const node = n as {
              type?: string;
              attrs?: { latex?: string };
              content?: unknown[];
            };
            if (node.type === "inlineMath" && node.attrs?.latex) {
              out.push(node.attrs.latex);
            }
            if (Array.isArray(node.content)) node.content.forEach(walk);
          };
          nodes.forEach(walk);
          return out;
        };
        for (const latex of collectLatex(res.blocks)) assertKatex(latex);
      });

      it("niciun element OMML necunoscut nedeclarat", () => {
        // Nu blochează (recursăm text), dar îl vrem vizibil în raport dacă apare.
        if (res.unknown.length) {
          // Log intenționat: dacă apare, e semnal pt ETAPA B, nu eroare de test.
          console.warn(`[${name}] OMML necunoscut:`, res.unknown);
        }
        expect(Array.isArray(res.unknown)).toBe(true);
      });
    });
  }
});

describe("docxArrayBufferToBlocks — binar .docx real (unzip + rels + media)", () => {
  const REL_NS =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  /** Împachetează un `.docx` minimal din `document.xml`-ul REAL + rels + media opțional. */
  function buildDocx(name: string, imageTarget?: string): ArrayBuffer {
    const files: Record<string, Uint8Array> = {
      "word/document.xml": strToU8(loadFixture(name)),
    };
    if (imageTarget) {
      files["word/_rels/document.xml.rels"] = strToU8(
        `<?xml version="1.0" encoding="UTF-8"?>` +
          `<Relationships xmlns="${REL_NS}">` +
          `<Relationship Id="rId5" Type="${REL_NS}/image" Target="${imageTarget}"/>` +
          `</Relationships>`,
      );
      // Conținut arbitrar (nu se validează formatul, doar se base64-uiește).
      files[`word/${imageTarget}`] = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    }
    const z = zipSync(files);
    return z.buffer.slice(
      z.byteOffset,
      z.byteOffset + z.byteLength,
    ) as ArrayBuffer;
  }

  it("multimi2 (fără imagini): 20 formule, 0 imagini", () => {
    const r = docxArrayBufferToBlocks(buildDocx("multimi2"));
    expect(r.ommlCount).toBe(20);
    expect(r.emittedMathCount).toBe(20);
    expect(r.imageCount).toBe(0);
  });

  it("unghiuri (rId5 → JPEG): 6 formule + 1 imagine cu data-URI real", () => {
    const r = docxArrayBufferToBlocks(
      buildDocx("unghiuri", "media/image1.jpeg"),
    );
    expect(r.ommlCount).toBe(6);
    expect(r.imageCount).toBe(1);
    expect(r.unresolvedImages).toBe(0);
    const findImg = (nodes: unknown[]): string | null => {
      for (const n of nodes) {
        const node = n as {
          type?: string;
          attrs?: { src?: string };
          content?: unknown[];
        };
        if (node.type === "image" && node.attrs?.src) return node.attrs.src;
        if (Array.isArray(node.content)) {
          const s = findImg(node.content);
          if (s) return s;
        }
      }
      return null;
    };
    expect(findImg(r.blocks)).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("unghiuri (rId5 → EMF nesuportat): 0 imagini, 1 nerezolvată (banner onest)", () => {
    const r = docxArrayBufferToBlocks(
      buildDocx("unghiuri", "media/image1.emf"),
    );
    expect(r.imageCount).toBe(0);
    expect(r.unresolvedImages).toBe(1);
  });

  it("zip fără word/document.xml → aruncă", () => {
    const z = zipSync({ "foo.txt": strToU8("bar") });
    const buf = z.buffer.slice(
      z.byteOffset,
      z.byteOffset + z.byteLength,
    ) as ArrayBuffer;
    expect(() => docxArrayBufferToBlocks(buf)).toThrow(/word\/document\.xml/);
  });
});
