/**
 * FAZA 2 (2.B) — dovada că bug-ul SK e reparat la sursă.
 *
 * Cazul din mijloc reproduce EXACT corpul observat live pe producție pe 08.09.2026:
 * runtime-ul Vercel Python scurge `x-vercel-internal-timing` înaintea JSON-ului, iar
 * `res.json()` crapă cu „Unexpected token 'x'". Traducerea era acolo, corectă —
 * doar că nimeni n-o putea citi.
 */

import { readJson } from "./json-response";

// Nu vrem ca `reportFailure` să scrie în Supabase din test; ne interesează doar
// că recuperarea se semnalează, nu unde ajunge semnalul.
jest.mock("./failure", () => ({
  reportFailure: jest.fn(() => ({
    code: "E-NET-003",
    kind: "badResponse",
    cause: "",
    userMessage: "",
  })),
}));
import { reportFailure } from "./failure";

function raspuns(corp: string, status = 200): Response {
  return {
    status,
    text: async () => corp,
  } as unknown as Response;
}

const CORP_BUN =
  '{"translated_sections":[{"type":"paragraph","content":"Ahoj"}]}';

describe("readJson — corp deteriorat de framing-ul Vercel", () => {
  beforeEach(() => (reportFailure as jest.Mock).mockClear());

  it("citește normal un JSON curat, fără să raporteze nimic", async () => {
    const d = await readJson<{ translated_sections: unknown[] }>(
      raspuns(CORP_BUN),
      "test",
    );
    expect(d.translated_sections).toHaveLength(1);
    expect(reportFailure).not.toHaveBeenCalled();
  });

  it("RECUPEREAZĂ corpul cu framing scurs (bug-ul SK real) și îl semnalează ca warn", async () => {
    const corpStricat = `x-vercel-internal-timing: dur=123;desc="cold"\r\n${CORP_BUN}`;
    const d = await readJson<{
      translated_sections: { content: string }[];
    }>(raspuns(corpStricat), "editor.translate");

    // Traducerea ajunge la utilizator, nu se pierde.
    expect(d.translated_sections[0].content).toBe("Ahoj");

    // Dar recuperarea NU e tăcută — altfel n-am ști cât de des se întâmplă.
    expect(reportFailure).toHaveBeenCalledTimes(1);
    const arg = (reportFailure as jest.Mock).mock.calls[0][0];
    expect(arg.code).toBe("E-NET-003");
    expect(arg.severity).toBe("warn");
    expect(arg.context.recovered).toBe(true);
    expect(arg.context.trimmedBytes).toBeGreaterThan(0);
  });

  it("recuperează și când framing-ul precedă un ARRAY, nu un obiect", async () => {
    const d = await readJson<number[]>(
      raspuns("x-vercel-internal: 1\r\n[1,2,3]"),
      "test",
    );
    expect(d).toEqual([1, 2, 3]);
  });

  it("aruncă o eroare cu CAUZA REALĂ dacă nici după curățare nu e JSON", async () => {
    await expect(
      readJson(raspuns("504 Gateway Timeout — nu e JSON deloc", 504), "test"),
    ).rejects.toThrow(/Raspuns JSON deteriorat/);
  });

  it("eroarea aruncată e SyntaxError → `classify` o încadrează la badResponse, nu la bug de cod", async () => {
    // Regresie pe diagnostic: dacă tipul erorii se schimbă, cauza ar fi raportată
    // în direcția greșită — exact greșeala reparată la Faza 1.
    await expect(
      readJson(raspuns("<html>502</html>"), "test"),
    ).rejects.toBeInstanceOf(SyntaxError);
  });

  it("corp gol → eroare explicită, nu `undefined` strecurat mai departe", async () => {
    await expect(readJson(raspuns(""), "test")).rejects.toThrow(/corp gol/);
  });

  it("`report: false` recuperează la fel, dar NU inundă jurnalul (sonde repetitive)", async () => {
    // `VersionBadge` întreabă /api/health la fiecare 30 de secunde. Fereastra
    // anti-dublură din failure.ts e de 2s, deci fiecare sondă ar produce un rând
    // nou — exact inundarea suprafeței de diagnostic pe care Faza 1 a curățat-o.
    const corpStricat = `x-vercel-internal-timing: dur=99\r\n${CORP_BUN}`;
    const d = await readJson<{ translated_sections: { content: string }[] }>(
      raspuns(corpStricat),
      "layout.version",
      { report: false },
    );
    expect(d.translated_sections[0].content).toBe("Ahoj"); // recuperarea se face
    expect(reportFailure).not.toHaveBeenCalled(); // dar tăcut
  });

  it("implicit se RAPORTEAZĂ — tăcerea trebuie cerută explicit, nu moștenită din greșeală", async () => {
    await readJson(raspuns(`junk\r\n${CORP_BUN}`), "editor.translate");
    expect(reportFailure).toHaveBeenCalledTimes(1);
  });
});
